// Rendu de `CLAUDE.md` : index court qui pointe vers les skills. Tout ce qui nomme la stack
// (lignes de la table projet, commandes, légende des outils) vient du pack.
import { pickText } from '../../catalog/text.js';
import { blocks, bullets, document, table } from '../markdown.js';
import type { RenderedFile } from '../types.js';
import { LANGUAGE_LABEL } from './i18n.js';
import type { RenderModel } from './model.js';
import { skillPath } from './skills.js';

function projectTable(model: RenderModel): string {
  const s = model.strings.claudeMd;
  const { scaffold, profile, pack } = model.input;
  const labels = LANGUAGE_LABEL[model.language];
  const rows = pack.presentation.projectRows(scaffold, model.language);
  return table(
    ['', ''],
    [
      [s.projectName, `\`${scaffold.project.name}\``],
      ...rows.beforeProfile.map((r) => [r.label, r.value]),
      [s.profile, `\`${profile.meta.id}\` — ${pickText(profile.meta.summary, model.language)}`],
      ...rows.afterProfile.map((r) => [r.label, r.value]),
      [
        s.languages,
        s.commentsAndDocs(labels[scaffold.language.comments], labels[scaffold.language.docs]),
      ],
    ],
  );
}

function permanentRules(model: RenderModel): string {
  const coreWorkflow = model.skills.workflow?.groups.find((g) => g.kind === 'core');
  const rules = coreWorkflow?.rules ?? [];
  return bullets(rules.map((r) => `**${r.id}** — ${r.statement}`));
}

function skillsTable(model: RenderModel): string {
  const s = model.strings;
  return table(
    [s.claudeMd.skillColumn, s.claudeMd.contentColumn, s.claudeMd.fileColumn],
    model.skillList.map((skill) => [
      `\`${skill.id}\``,
      skill.description,
      `\`${skillPath(skill.id)}\``,
    ]),
  );
}

export function renderClaudeMd(model: RenderModel): RenderedFile {
  const s = model.strings.claudeMd;
  const { scaffold, pack } = model.input;
  const commands = pack.presentation
    .commands(model.language)
    .map(([command, purpose]) => `\`${command}\` — ${purpose}`);
  const content = document(
    `<!-- ${model.strings.generatedHeader(model.input.toolVersion)} -->`,
    `# ${scaffold.project.name}`,
    scaffold.project.description,
    s.intro,
    `## ${s.projectSection}`,
    projectTable(model),
    `## ${s.permanentRules}`,
    s.permanentRulesIntro,
    permanentRules(model),
    `## ${s.skillsSection}`,
    s.skillsIntro(`${model.input.profile.meta.rule_prefix}-002`),
    skillsTable(model),
    `## ${s.readingRules}`,
    s.readingRulesLegend,
    bullets([pack.presentation.enforcedLegend(model.language), s.guidanceLegend]),
    `## ${s.commands}`,
    bullets([...commands, `\`prepwork sync\` — ${s.commandSync}`]),
    `## ${s.ownership}`,
    bullets([s.ownershipGenerated, s.ownershipTeam, s.ownershipSource]),
    `## ${s.git}`,
    bullets([
      `${s.gitAuthor}${model.strings.colon}\`${scaffold.git.author.name} <${scaffold.git.author.email}>\``,
      scaffold.git.agent_trailer ? s.gitTrailer : s.gitNoTrailer,
      s.gitForbidden,
    ]),
  );
  return { path: 'CLAUDE.md', content: blocks(content) + '\n' };
}
