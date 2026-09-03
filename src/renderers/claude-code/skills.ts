// Rendu d'un skill Claude Code : `.claude/skills/<name>/SKILL.md` avec frontmatter.
// Les sections génériques (profil, exemple de référence, dépendances, réglages, variables
// d'environnement) sont ici ; celles qui nomment la stack viennent de `pack.skillSections`.
import { pickText } from '../../catalog/text.js';
import type { SkillPresentation, SkillSections } from '../../packs/types.js';
import { blocks, bullets, document, frontmatter, numbered, table } from '../markdown.js';
import type { RenderedFile } from '../types.js';
import { LANGUAGE_LABEL } from './i18n.js';
import type { RenderModel, ResolvedRule, SourceGroup } from './model.js';
import { substitute } from './model.js';

export function skillPath(name: string): string {
  return `.claude/skills/${name}/SKILL.md`;
}

/** Sections propres à une source, placées avant (contexte) ou après (annexes) ses règles. */
type Extra = SkillSections;

function marker(model: RenderModel, rule: ResolvedRule): string {
  return rule.enforcedBy === 'none' ? model.strings.skill.guidance : `\`${rule.enforcedBy}\``;
}

function renderRules(model: RenderModel, rules: readonly ResolvedRule[]): string {
  const s = model.strings.skill;
  return bullets(
    rules.map(
      (rule) =>
        `**${rule.id}** · ${marker(model, rule)} — ${rule.statement}\n  ${s.why}${model.strings.colon}${rule.rationale}`,
    ),
  );
}

function renderAntiPatterns(model: RenderModel, antiPatterns: readonly ResolvedRule[]): string {
  const s = model.strings.skill;
  return bullets(
    antiPatterns.map(
      (ap) =>
        `**${ap.id}** · ${marker(model, ap)} — ${ap.statement}\n  ${s.why}${model.strings.colon}${ap.rationale}\n  ${s.instead}${model.strings.colon}${ap.instead ?? ''}`,
    ),
  );
}

function renderGroup(model: RenderModel, group: SourceGroup, extra: Extra = {}): string {
  const s = model.strings.skill;
  const hasContent = group.rules.length > 0 || group.antiPatterns.length > 0;
  return blocks(
    `## ${group.title}`,
    group.summary !== undefined && group.summary,
    extra.before,
    group.rules.length > 0 && `### ${s.rules}`,
    group.rules.length > 0 && renderRules(model, group.rules),
    group.antiPatterns.length > 0 && `### ${s.antiPatterns}`,
    group.antiPatterns.length > 0 && renderAntiPatterns(model, group.antiPatterns),
    !hasContent && s.noRules,
    extra.after,
  );
}

/** Skill `architecture` : quand utiliser et couches avant les règles ; exemple et dépendances après. */
function architectureExtra(model: RenderModel): Extra {
  const s = model.strings.skill;
  const profile = model.input.profile;
  const lang = model.language;
  const layers = profile.architecture.layers;

  const before = blocks(
    `### ${s.whenToUse}`,
    bullets(profile.meta.when_to_use.map((t) => pickText(t, lang))),
    `### ${s.whenNotToUse}`,
    bullets(profile.meta.when_not_to_use.map((t) => pickText(t, lang))),
    layers.length > 0 && `### ${s.layers}`,
    layers.length > 0 &&
      table(
        [s.layerColumn, model.input.pack.presentation.layerTargetColumn(lang), s.mayDependOn],
        layers.map((l) => [
          `\`${l.id}\``,
          `\`${substitute(model, l.target)}\``,
          l.may_depend_on.length > 0
            ? l.may_depend_on.map((d) => `\`${d}\``).join(', ')
            : s.nothing,
        ]),
      ),
  );

  const example = profile.reference_example;
  const deps = profile.dependencies;
  const after = blocks(
    `### ${s.referenceExample}`,
    pickText(example.feature, lang),
    example.files.length > 0 && `${s.referenceFiles}${model.strings.colon.trimEnd()}`,
    example.files.length > 0 && bullets(example.files.map((f) => `\`${substitute(model, f)}\``)),
    example.demonstrates.length > 0 &&
      `${s.referenceDemonstrates}${model.strings.colon}${example.demonstrates.map((id) => `**${id}**`).join(', ')}`,
    `### ${s.dependencies}`,
    deps.allowed.length > 0 && `**${s.allowedDependencies}**`,
    deps.allowed.length > 0 &&
      table(
        [s.artifactColumn, s.purposeColumn],
        deps.allowed.map((d) => [`\`${d.artifact}\``, pickText(d.purpose, lang)]),
      ),
    deps.forbidden.length > 0 && `**${s.forbiddenDependencies}**`,
    deps.forbidden.length > 0 &&
      table(
        [s.artifactColumn, s.rationaleColumn],
        deps.forbidden.map((d) => [`\`${d.artifact}\``, pickText(d.rationale, lang)]),
      ),
    `**${s.addProcedure}**`,
    numbered(deps.add_procedure.map((step) => pickText(step, lang))),
  );

  return { before, after };
}

/** Skill `workflow` : réglages du projet, après les règles de base. */
function workflowExtra(model: RenderModel): Extra {
  const s = model.strings.skill;
  const { scaffold } = model.input;
  const labels = LANGUAGE_LABEL[model.language];
  return {
    after: blocks(
      `### ${s.settings}`,
      table(
        ['', ''],
        [
          [s.settingComments, labels[scaffold.language.comments]],
          [s.settingDocs, labels[scaffold.language.docs]],
          [s.settingAuthor, `${scaffold.git.author.name} <${scaffold.git.author.email}>`],
          [
            s.settingTrailer,
            scaffold.git.agent_trailer
              ? '`Co-Authored-By: Claude <noreply@anthropic.com>`'
              : model.strings.claudeMd.no,
          ],
        ],
      ),
    ),
  };
}

/** Skill `security` : variables d'environnement contribuées par les options, après les règles de base. */
function securityExtra(model: RenderModel): Extra {
  const s = model.strings.skill;
  const env = model.input.options.flatMap((o) => o.env);
  if (env.length === 0) return {};
  return {
    after: blocks(
      `### ${s.envVars}`,
      table(
        [s.envVarColumn, s.envExampleColumn, s.envCommentColumn],
        env.map((v) => [`\`${v.name}\``, `\`${v.example}\``, pickText(v.comment, model.language)]),
      ),
    ),
  };
}

function packExtra(model: RenderModel, skillId: string): Extra {
  return (
    model.input.pack.presentation.skillSections(skillId, {
      scaffold: model.input.scaffold,
      profile: model.input.profile,
      options: model.input.options,
      language: model.language,
    }) ?? {}
  );
}

function extrasFor(model: RenderModel, skillId: string): { core: Extra; profile: Extra } {
  switch (skillId) {
    case 'architecture':
      return { core: {}, profile: architectureExtra(model) };
    case 'workflow':
      return { core: workflowExtra(model), profile: packExtra(model, skillId) };
    case 'security':
      return { core: securityExtra(model), profile: packExtra(model, skillId) };
    default:
      return { core: {}, profile: packExtra(model, skillId) };
  }
}

function hasExtra(extra: Extra): boolean {
  return extra.before !== undefined || extra.after !== undefined;
}

export function renderSkill(model: RenderModel, skill: SkillPresentation): RenderedFile {
  const s = model.strings.skill;
  const view = model.skills[skill.id];
  const extras = extrasFor(model, skill.id);
  const groupBlocks = (view?.groups ?? []).map((group) =>
    renderGroup(
      model,
      group,
      group.kind === 'core' ? extras.core : group.kind === 'profile' ? extras.profile : {},
    ),
  );
  // Un profil sans règle pour ce skill garde ses sections propres (architecture, db).
  const profileHasGroup = (view?.groups ?? []).some((g) => g.kind === 'profile');
  const orphanProfileExtra =
    !profileHasGroup && hasExtra(extras.profile)
      ? blocks(
          `## ${s.profileSection(model.input.profile.meta.id)}`,
          extras.profile.before,
          extras.profile.after,
        )
      : undefined;

  const content = document(
    frontmatter({ name: skill.id, description: skill.description }),
    `<!-- ${model.strings.generatedHeader(model.input.toolVersion)} -->`,
    `# ${skill.title}`,
    skill.intro,
    s.legend,
    ...groupBlocks,
    orphanProfileExtra,
  );
  return { path: skillPath(skill.id), content };
}
