// Renderer `agents-md` : un seul fichier `AGENTS.md` à la racine, la forme attendue par les
// agents qui suivent cette convention. Le découpage en skills de `claude-code` devient ici un
// découpage en sections d'un même document ; les règles, elles, sont les mêmes (CLAUDE.md §2).
import type { AntiPattern, Language, Rule } from '../../catalog/schema.js';
import { pickText } from '../../catalog/text.js';
import type { SkillPresentation } from '../../packs/types.js';
import { blocks, bullets, document, numbered, table } from '../markdown.js';
import type { RenderedFile, Renderer, RenderInput } from '../types.js';
import { LANGUAGE_LABEL, STRINGS, type Strings } from './i18n.js';

interface ResolvedRule {
  id: string;
  statement: string;
  rationale: string;
  enforcedBy: string;
  instead?: string;
}

function resolve(rule: Rule, language: Language): ResolvedRule {
  return {
    id: rule.id,
    statement: pickText(rule.statement, language),
    rationale: pickText(rule.rationale, language),
    enforcedBy: rule.enforced_by,
  };
}

function resolveAntiPattern(ap: AntiPattern, language: Language): ResolvedRule {
  return { ...resolve(ap, language), instead: pickText(ap.instead, language) };
}

function marker(rule: ResolvedRule, s: Strings): string {
  return rule.enforcedBy === 'none' ? s.guidance : `\`${rule.enforcedBy}\``;
}

function renderRules(rules: readonly ResolvedRule[], s: Strings): string {
  return bullets(
    rules.map((rule) => {
      const why = `\n  ${s.why}${s.colon}${rule.rationale}`;
      const instead = rule.instead === undefined ? '' : `\n  ${s.instead}${s.colon}${rule.instead}`;
      return `**${rule.id}** · ${marker(rule, s)} — ${rule.statement}${why}${instead}`;
    }),
  );
}

/** Une source (core, profil, option) telle qu'elle apparaît dans la section d'un sujet. */
interface SourceBlock {
  title: string;
  summary?: string | undefined;
  rules: ResolvedRule[];
  antiPatterns: ResolvedRule[];
}

function renderSource(block: SourceBlock, s: Strings): string {
  const empty = block.rules.length === 0 && block.antiPatterns.length === 0;
  return blocks(
    `### ${block.title}`,
    block.summary,
    block.rules.length > 0 && renderRules(block.rules, s),
    block.antiPatterns.length > 0 && `**${s.antiPatterns}**`,
    block.antiPatterns.length > 0 && renderRules(block.antiPatterns, s),
    empty && s.noRules,
  );
}

function projectTable(input: RenderInput, s: Strings, language: Language): string {
  const labels = LANGUAGE_LABEL[language];
  const rows = input.pack.presentation.projectRows(input.scaffold, language);
  return table(
    ['', ''],
    [
      [s.projectName, `\`${input.scaffold.project.name}\``],
      ...rows.beforeProfile.map((row) => [row.label, row.value]),
      [
        s.profile,
        `\`${input.profile.meta.id}\` — ${pickText(input.profile.meta.summary, language)}`,
      ],
      ...rows.afterProfile.map((row) => [row.label, row.value]),
      [
        s.languages,
        s.commentsAndDocs(
          labels[input.scaffold.language.comments],
          labels[input.scaffold.language.docs],
        ),
      ],
    ],
  );
}

/** Contexte du profil : quand il convient, ses couches, son exemple, ses dépendances. */
function profileContext(input: RenderInput, s: Strings, language: Language): string {
  const profile = input.profile;
  const layers = profile.architecture.layers;
  const example = profile.reference_example;
  const deps = profile.dependencies;
  const substitute = (value: string): string =>
    input.pack.presentation.substitute(input.scaffold, value);

  return blocks(
    `#### ${s.whenToUse}`,
    bullets(profile.meta.when_to_use.map((text) => pickText(text, language))),
    `#### ${s.whenNotToUse}`,
    bullets(profile.meta.when_not_to_use.map((text) => pickText(text, language))),
    layers.length > 0 && `#### ${s.layers}`,
    layers.length > 0 &&
      table(
        [s.layerColumn, input.pack.presentation.layerTargetColumn(language), s.mayDependOn],
        layers.map((layer) => [
          `\`${layer.id}\``,
          `\`${substitute(layer.target)}\``,
          layer.may_depend_on.length > 0
            ? layer.may_depend_on.map((id) => `\`${id}\``).join(', ')
            : s.nothing,
        ]),
      ),
    `#### ${s.referenceExample}`,
    pickText(example.feature, language),
    example.files.length > 0 && `${s.referenceFiles}${s.colon.trimEnd()}`,
    example.files.length > 0 && bullets(example.files.map((f) => `\`${substitute(f)}\``)),
    example.demonstrates.length > 0 &&
      `${s.referenceDemonstrates}${s.colon}${example.demonstrates.map((id) => `**${id}**`).join(', ')}`,
    `#### ${s.dependencies}`,
    deps.allowed.length > 0 && `**${s.allowedDependencies}**`,
    deps.allowed.length > 0 &&
      table(
        [s.artifactColumn, s.purposeColumn],
        deps.allowed.map((d) => [`\`${d.artifact}\``, pickText(d.purpose, language)]),
      ),
    deps.forbidden.length > 0 && `**${s.forbiddenDependencies}**`,
    deps.forbidden.length > 0 &&
      table(
        [s.artifactColumn, s.rationaleColumn],
        deps.forbidden.map((d) => [`\`${d.artifact}\``, pickText(d.rationale, language)]),
      ),
    `**${s.addProcedure}**`,
    numbered(deps.add_procedure.map((step) => pickText(step, language))),
  );
}

function envTable(input: RenderInput, s: Strings, language: Language): string | undefined {
  const env = input.options.flatMap((option) => option.env);
  if (env.length === 0) return undefined;
  return blocks(
    `#### ${s.envVars}`,
    table(
      [s.envVarColumn, s.envExampleColumn, s.envCommentColumn],
      env.map((variable) => [
        `\`${variable.name}\``,
        `\`${variable.example}\``,
        pickText(variable.comment, language),
      ]),
    ),
  );
}

/** Section d'un sujet : les règles de base, celles du profil, puis celles des options. */
function topicSection(
  input: RenderInput,
  topic: SkillPresentation,
  s: Strings,
  language: Language,
): string {
  const core: SourceBlock = {
    title: s.coreSection,
    rules: [],
    antiPatterns: [],
  };
  for (const set of input.core) {
    if (set.skill !== topic.id) continue;
    core.rules.push(...set.rules.map((rule) => resolve(rule, language)));
    core.antiPatterns.push(...set.anti_patterns.map((ap) => resolveAntiPattern(ap, language)));
  }
  core.rules.sort((a, b) => a.id.localeCompare(b.id));
  core.antiPatterns.sort((a, b) => a.id.localeCompare(b.id));

  const profileIds = input.profile.skills[topic.id] ?? [];
  const rulesById = new Map(input.profile.rules.map((rule) => [rule.id, rule]));
  const antiPatternsById = new Map(input.profile.anti_patterns.map((ap) => [ap.id, ap]));
  const profileBlock: SourceBlock = {
    title: s.profileSection(input.profile.meta.id),
    summary: pickText(input.profile.meta.summary, language),
    rules: profileIds.flatMap((id) => {
      const rule = rulesById.get(id);
      return rule ? [resolve(rule, language)] : [];
    }),
    antiPatterns: profileIds.flatMap((id) => {
      const ap = antiPatternsById.get(id);
      return ap ? [resolveAntiPattern(ap, language)] : [];
    }),
  };

  const optionBlocks = input.options
    .filter((option) => option.skill === topic.id)
    .map((option): SourceBlock => ({
      title: s.optionSection(option.meta.id),
      summary: pickText(option.meta.summary, language),
      rules: option.rules.map((rule) => resolve(rule, language)),
      antiPatterns: option.anti_patterns.map((ap) => resolveAntiPattern(ap, language)),
    }));

  const hasProfile = profileIds.length > 0;
  const packSections = input.pack.presentation.skillSections(topic.id, {
    scaffold: input.scaffold,
    profile: input.profile,
    options: input.options,
    language,
  });
  const isArchitecture = topic.id === 'architecture';

  return blocks(
    `## ${topic.title}`,
    topic.intro,
    packSections?.before,
    core.rules.length > 0 || core.antiPatterns.length > 0 ? renderSource(core, s) : undefined,
    (hasProfile || isArchitecture) &&
      blocks(
        renderSource(profileBlock, s),
        isArchitecture ? profileContext(input, s, language) : undefined,
      ),
    ...optionBlocks.map((block) => renderSource(block, s)),
    topic.id === 'security' ? envTable(input, s, language) : undefined,
    packSections?.after,
  );
}

function settingsBlock(input: RenderInput, s: Strings, language: Language): string {
  const labels = LANGUAGE_LABEL[language];
  const { scaffold } = input;
  return blocks(
    `## ${s.settings}`,
    table(
      ['', ''],
      [
        [s.settingComments, labels[scaffold.language.comments]],
        [s.settingDocs, labels[scaffold.language.docs]],
      ],
    ),
  );
}

export const agentsMdRenderer: Renderer = {
  id: 'agents-md',
  render(input: RenderInput): RenderedFile[] {
    const language = input.scaffold.language.docs;
    const s = STRINGS[language];
    const topics = input.pack.presentation.skills(language);

    const permanent = input.core
      .filter((set) => set.skill === 'workflow')
      .flatMap((set) => set.rules.map((rule) => resolve(rule, language)))
      .sort((a, b) => a.id.localeCompare(b.id));

    const commands = input.pack.presentation
      .commands(language)
      .map(([command, purpose]) => `\`${command}\` — ${purpose}`);

    const content = document(
      `<!-- ${s.generatedHeader(input.toolVersion)} -->`,
      `# ${input.scaffold.project.name}`,
      input.scaffold.project.description,
      s.intro,
      `## ${s.project}`,
      projectTable(input, s, language),
      `## ${s.howToRead}`,
      s.howToReadLegend,
      bullets([input.pack.presentation.enforcedLegend(language), s.guidanceLegend]),
      `## ${s.permanentRules}`,
      s.permanentRulesIntro,
      bullets(permanent.map((rule) => `**${rule.id}** — ${rule.statement}`)),
      s.topicsIntro,
      ...topics.map((topic) => topicSection(input, topic, s, language)),
      `## ${s.commands}`,
      bullets([...commands, `\`prepwork sync\` — ${s.commandSync}`]),
      settingsBlock(input, s, language),
      `## ${s.ownership}`,
      bullets([s.ownershipGenerated, s.ownershipTeam, s.ownershipSource]),
      `## ${s.git}`,
      bullets([
        `${s.gitAuthor}${s.colon}\`${input.scaffold.git.author.name} <${input.scaffold.git.author.email}>\``,
        input.scaffold.git.agent_trailer ? s.gitTrailer : s.gitNoTrailer,
        s.gitForbidden,
      ]),
    );

    return [{ path: 'AGENTS.md', content: blocks(content) + '\n' }];
  },
};
