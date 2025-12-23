// Vue "prête à rendre" de l'entrée : règles résolues dans la langue de la documentation,
// regroupées par skill puis par source. Partagée par CLAUDE.md et les skills. Les skills eux-
// mêmes (identifiants, ordre, titres) viennent du pack : le renderer ne les connaît pas.
import type {
  AntiPattern,
  CoreRuleSet,
  Language,
  Option,
  Profile,
  Rule,
} from '../../catalog/schema.js';
import { pickText } from '../../catalog/text.js';
import type { SkillPresentation } from '../../packs/types.js';
import type { RenderInput } from '../types.js';
import { STRINGS, type Strings } from './i18n.js';

export interface ResolvedRule {
  id: string;
  statement: string;
  rationale: string;
  enforcedBy: string;
  /** Renseigné pour un anti-pattern. */
  instead?: string;
}

export interface SourceGroup {
  kind: 'core' | 'profile' | 'option';
  id: string;
  title: string;
  /** Résumé de l'option ou du profil, absent pour core. */
  summary?: string;
  rules: ResolvedRule[];
  antiPatterns: ResolvedRule[];
}

export interface SkillView {
  name: string;
  groups: SourceGroup[];
}

export interface RenderModel {
  input: RenderInput;
  language: Language;
  strings: Strings;
  /** Skills du pack, dans l'ordre d'affichage. */
  skillList: SkillPresentation[];
  skills: Record<string, SkillView>;
}

function resolveRule(rule: Rule, language: Language): ResolvedRule {
  return {
    id: rule.id,
    statement: pickText(rule.statement, language),
    rationale: pickText(rule.rationale, language),
    enforcedBy: rule.enforced_by,
  };
}

function resolveAntiPattern(ap: AntiPattern, language: Language): ResolvedRule {
  return { ...resolveRule(ap, language), instead: pickText(ap.instead, language) };
}

function coreGroups(
  core: readonly CoreRuleSet[],
  language: Language,
  strings: Strings,
): Map<string, SourceGroup> {
  // Plusieurs fichiers core peuvent viser le même skill (workflow + language) : on fusionne.
  const groups = new Map<string, SourceGroup>();
  for (const set of core) {
    const group = groups.get(set.skill) ?? {
      kind: 'core',
      id: 'core',
      title: strings.skill.coreSection,
      rules: [],
      antiPatterns: [],
    };
    group.rules.push(...set.rules.map((r) => resolveRule(r, language)));
    group.antiPatterns.push(...set.anti_patterns.map((a) => resolveAntiPattern(a, language)));
    groups.set(set.skill, group);
  }
  for (const group of groups.values()) {
    group.rules.sort((a, b) => a.id.localeCompare(b.id));
    group.antiPatterns.sort((a, b) => a.id.localeCompare(b.id));
  }
  return groups;
}

function profileGroups(
  profile: Profile,
  skillIds: readonly string[],
  language: Language,
  strings: Strings,
): Map<string, SourceGroup> {
  const rulesById = new Map(profile.rules.map((r) => [r.id, r]));
  const antiPatternsById = new Map(profile.anti_patterns.map((a) => [a.id, a]));
  const groups = new Map<string, SourceGroup>();
  for (const name of skillIds) {
    const ids = profile.skills[name] ?? [];
    if (ids.length === 0) continue;
    const group: SourceGroup = {
      kind: 'profile',
      id: profile.meta.id,
      title: strings.skill.profileSection(profile.meta.id),
      summary: pickText(profile.meta.summary, language),
      rules: [],
      antiPatterns: [],
    };
    for (const id of ids) {
      const rule = rulesById.get(id);
      if (rule) group.rules.push(resolveRule(rule, language));
      const ap = antiPatternsById.get(id);
      if (ap) group.antiPatterns.push(resolveAntiPattern(ap, language));
    }
    groups.set(name, group);
  }
  return groups;
}

function optionGroup(option: Option, language: Language, strings: Strings): SourceGroup {
  return {
    kind: 'option',
    id: option.meta.id,
    title: strings.skill.optionSection(option.meta.id),
    summary: pickText(option.meta.summary, language),
    rules: option.rules.map((r) => resolveRule(r, language)),
    antiPatterns: option.anti_patterns.map((a) => resolveAntiPattern(a, language)),
  };
}

export function buildModel(input: RenderInput): RenderModel {
  const language = input.scaffold.language.docs;
  const strings = STRINGS[language];
  const skillList = input.pack.presentation.skills(language);
  const skills: Record<string, SkillView> = {};
  for (const skill of skillList) skills[skill.id] = { name: skill.id, groups: [] };

  const core = coreGroups(input.core, language, strings);
  const profile = profileGroups(
    input.profile,
    skillList.map((s) => s.id),
    language,
    strings,
  );
  for (const skill of skillList) {
    const view = skills[skill.id];
    if (view === undefined) continue;
    const coreGroup = core.get(skill.id);
    if (coreGroup) view.groups.push(coreGroup);
    const profileGroup = profile.get(skill.id);
    if (profileGroup) view.groups.push(profileGroup);
  }
  for (const option of input.options) {
    skills[option.skill]?.groups.push(optionGroup(option, language, strings));
  }

  return { input, language, strings, skillList, skills };
}

/** Remplace les placeholders du catalogue par leur valeur concrète (le pack sait comment). */
export function substitute(model: RenderModel, value: string): string {
  return model.input.pack.presentation.substitute(model.input.scaffold, value);
}
