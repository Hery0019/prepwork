// Vérifications de cohérence du catalogue (CLAUDE.md §8) : identifiants, préfixes,
// orthogonalité profil ↔ option, tests ArchUnit associés aux règles, listes de fichiers.
// Retourne des diagnostics ; le script `check:content` décide du code de sortie.
import type { Diagnostic } from '../errors.js';
import { PrepworkError } from '../errors.js';
import { conditionPaths, parseCondition } from './condition.js';
import type { Catalog, CatalogSource } from './load.js';
import { catalogSources } from './load.js';
import type { StackPack } from '../packs/types.js';
import type { AntiPattern, LocalizedText, Rule } from './schema.js';
import { allVariants } from './text.js';

const CORE_PREFIX = 'CORE';

interface RuleLike {
  id: string;
  enforced_by: string;
  texts: string[];
}

function ruleLikes(rules: readonly Rule[], antiPatterns: readonly AntiPattern[]): RuleLike[] {
  return [
    ...rules.map((r) => ({
      id: r.id,
      enforced_by: r.enforced_by,
      texts: [...allVariants(r.statement), ...allVariants(r.rationale)],
    })),
    ...antiPatterns.map((a) => ({
      id: a.id,
      enforced_by: a.enforced_by,
      texts: [...allVariants(a.statement), ...allVariants(a.rationale), ...allVariants(a.instead)],
    })),
  ];
}

function sourceRules(source: CatalogSource): RuleLike[] {
  switch (source.kind) {
    case 'core':
      return source.ruleSets.flatMap((set) => ruleLikes(set.rules, set.anti_patterns));
    case 'profile':
      return ruleLikes(source.profile.rules, source.profile.anti_patterns);
    case 'option':
      return ruleLikes(source.option.rules, source.option.anti_patterns);
  }
}

function sourcePrefix(source: CatalogSource): string {
  switch (source.kind) {
    case 'core':
      return CORE_PREFIX;
    case 'profile':
      return source.profile.meta.rule_prefix;
    case 'option':
      return source.option.meta.rule_prefix;
  }
}

/** Tous les textes libres d'une source, pour les vérifications d'orthogonalité. */
function sourceTexts(source: CatalogSource): string[] {
  const texts = sourceRules(source).flatMap((r) => r.texts);
  const push = (t: LocalizedText | LocalizedText[] | undefined): void => {
    if (t === undefined) return;
    for (const item of Array.isArray(t) ? t : [t]) texts.push(...allVariants(item));
  };
  if (source.kind === 'profile') {
    const p = source.profile;
    push(p.meta.summary);
    push(p.meta.when_to_use);
    push(p.meta.when_not_to_use);
    push(p.dependencies.add_procedure);
    for (const dep of p.dependencies.allowed) push(dep.purpose);
    for (const dep of p.dependencies.forbidden) push(dep.rationale);
    push(p.reference_example.feature);
  } else if (source.kind === 'option') {
    push(source.option.meta.summary);
    for (const env of source.option.env) push(env.comment);
  } else {
    for (const set of source.ruleSets) push(set.title);
  }
  return texts;
}

function sourceLabel(source: CatalogSource): string {
  switch (source.kind) {
    case 'core':
      return 'core';
    case 'profile':
      return `profiles/${source.id}`;
    case 'option':
      return `options/${source.id}`;
  }
}

function wordPattern(word: string): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9-])${escaped}(?![a-z0-9-])`, 'i');
}

function optionKeywords(optionId: string, generic: ReadonlySet<string>): string[] {
  const words = optionId.split('-').filter((w) => !generic.has(w));
  return [...new Set([optionId, ...words])].filter((w) => !generic.has(w));
}

export function validateCatalog(catalog: Catalog, pack: StackPack): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const testBacked = new Set(pack.testBackedEnforcers);
  const error = (source: string, message: string): void => {
    diagnostics.push({ level: 'error', source, message });
  };
  const warning = (source: string, message: string): void => {
    diagnostics.push({ level: 'warning', source, message });
  };
  const sources = catalogSources(catalog);

  // --- Identifiants uniques et préfixes cohérents ---------------------------------------
  const seenIds = new Map<string, string>();
  const seenPrefixes = new Map<string, string>();
  const allIds = new Set<string>();
  for (const source of sources) {
    const label = sourceLabel(source);
    const prefix = sourcePrefix(source);
    if (source.kind !== 'core' && prefix === CORE_PREFIX) {
      error(label, `le préfixe \`${CORE_PREFIX}\` est réservé à core/`);
    }
    const previous = seenPrefixes.get(prefix);
    if (previous !== undefined && previous !== label) {
      error(label, `préfixe \`${prefix}\` déjà utilisé par ${previous}`);
    }
    seenPrefixes.set(prefix, label);
    for (const rule of sourceRules(source)) {
      allIds.add(rule.id);
      const owner = seenIds.get(rule.id);
      if (owner !== undefined) {
        error(label, `id \`${rule.id}\` déjà déclaré dans ${owner}`);
      }
      seenIds.set(rule.id, label);
      if (!rule.id.startsWith(`${prefix}-`)) {
        error(label, `id \`${rule.id}\` : préfixe attendu \`${prefix}-\``);
      }
    }
  }

  // --- Exemple de référence : règles démontrées existantes -------------------------------
  for (const source of catalog.profiles.values()) {
    const label = sourceLabel(source);
    const ownIds = new Set(sourceRules(source).map((r) => r.id));
    const coreIds = new Set(sourceRules(catalog.core).map((r) => r.id));
    for (const id of source.profile.reference_example.demonstrates) {
      if (!ownIds.has(id) && !coreIds.has(id)) {
        error(
          label,
          `reference_example.demonstrates : \`${id}\` n'existe ni dans ce profil ni dans core/`,
        );
      }
    }
  }

  // --- Orthogonalité profil ↔ option (textes) --------------------------------------------
  const profileIds = [...catalog.profiles.keys()];
  const generic = new Set(pack.genericOptionWords);
  const optionWords = [...catalog.options.keys()].flatMap((id) => optionKeywords(id, generic));
  for (const source of catalog.options.values()) {
    const label = sourceLabel(source);
    for (const text of sourceTexts(source)) {
      for (const profileId of profileIds) {
        if (wordPattern(profileId).test(text)) {
          error(
            label,
            `mentionne le profil \`${profileId}\` : une option ne connaît pas le profil (« ${text} »)`,
          );
        }
      }
    }
  }
  for (const source of catalog.profiles.values()) {
    const label = sourceLabel(source);
    for (const text of sourceTexts(source)) {
      for (const word of optionWords) {
        if (wordPattern(word).test(text)) {
          error(
            label,
            `mentionne l'option \`${word}\` : un profil ne connaît pas les options (« ${text} »)`,
          );
        }
      }
    }
  }

  // --- Variables d'environnement : le préfixe public appartient au pack -------------------
  // Le préfixe (`VITE_`, `NEXT_PUBLIC_`) dépend de l'outil de build, donc du profil. Une option
  // qui l'écrit se lie au profil sans le dire, et casse l'autre profil au build.
  for (const source of catalog.options.values()) {
    const label = sourceLabel(source);
    for (const variable of source.option.env) {
      for (const reserved of pack.reservedEnvPrefixes) {
        if (variable.name.startsWith(reserved)) {
          error(
            label,
            `variable \`${variable.name}\` : le préfixe \`${reserved}\` appartient au pack — déclarer \`${variable.name.slice(reserved.length)}\` avec \`public: true\``,
          );
        }
      }
    }
  }

  // --- Listes de fichiers : templates existants, conditions valides, cibles uniques ------
  for (const source of sources) {
    const label = sourceLabel(source);
    // Deux entrées peuvent viser la même cible si chacune porte une condition (variantes exclusives).
    const targets = new Map<string, boolean>();
    for (const entry of source.files) {
      if (!source.templates.has(entry.source)) {
        error(label, `files.yaml : template \`${entry.source}\` introuvable dans templates/`);
      }
      if (entry.target.startsWith('/') || entry.target.split('/').includes('..')) {
        error(label, `files.yaml : cible \`${entry.target}\` doit être relative, sans \`..\``);
      }
      const conditional = entry.when !== undefined;
      const previous = targets.get(entry.target);
      if (previous !== undefined && !(previous && conditional)) {
        error(label, `files.yaml : cible \`${entry.target}\` déclarée deux fois sans condition`);
      }
      targets.set(entry.target, (previous ?? true) && conditional);
      if (entry.when !== undefined) {
        try {
          const paths = conditionPaths(parseCondition(entry.when));
          checkAxisPaths(source, paths, `files.yaml (\`${entry.target}\`)`, error);
        } catch (e) {
          error(label, e instanceof PrepworkError ? e.message : String(e));
        }
      }
    }
  }

  // --- Conditions portées par les contributions du pack -------------------------------------
  for (const source of sources) {
    if (source.kind === 'core') continue;
    const label = sourceLabel(source);
    const contribution = source.kind === 'profile' ? source.profile : source.option;
    for (const { where, when } of pack.contributionConditions(contribution)) {
      try {
        checkAxisPaths(source, conditionPaths(parseCondition(when)), where, error);
      } catch (e) {
        error(label, e instanceof PrepworkError ? e.message : String(e));
      }
    }
  }

  // --- Orthogonalité profil ↔ option (templates) -----------------------------------------
  for (const source of sources) {
    if (source.kind === 'core') continue;
    const label = sourceLabel(source);
    const forbidden = source.kind === 'profile' ? /\bit\.(options|optionIds)\b/ : /\bit\.profile\b/;
    for (const [path, content] of source.templates) {
      if (forbidden.test(content)) {
        error(
          label,
          `templates/${path} : référence \`${forbidden.source}\` — ${source.kind === 'profile' ? 'un profil ne connaît pas les options' : 'une option ne connaît pas le profil'}`,
        );
      }
    }
  }

  // --- Règles outillées par un test : le test porte l'id de la règle ----------------------
  for (const source of sources) {
    const label = sourceLabel(source);
    const testTemplates = [...source.templates.entries()].filter(([path]) =>
      pack.carriesRuleEvidence(path),
    );
    for (const rule of sourceRules(source)) {
      if (!testBacked.has(rule.enforced_by)) continue;
      const token = pack.ruleEvidenceToken(rule.id);
      const found = testTemplates.some(([, content]) => content.includes(token));
      if (found) continue;
      const message = `règle \`${rule.id}\` (enforced_by: ${rule.enforced_by}) sans test nommé \`${token}\``;
      if (source.templates.size === 0) warning(label, `${message} (aucun template encore écrit)`);
      else error(label, message);
    }
  }

  return diagnostics;
}

function checkAxisPaths(
  source: CatalogSource,
  paths: readonly string[],
  where: string,
  error: (source: string, message: string) => void,
): void {
  const label = sourceLabel(source);
  for (const path of paths) {
    if (
      source.kind === 'profile' &&
      (path === 'options' || path.startsWith('options.') || path === 'optionIds')
    ) {
      error(label, `${where} : condition sur \`${path}\` — un profil ne connaît pas les options`);
    }
    if (source.kind === 'option' && (path === 'profile' || path.startsWith('profile.'))) {
      error(label, `${where} : condition sur \`${path}\` — une option ne connaît pas le profil`);
    }
  }
}
