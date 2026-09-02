// Rendu de `CLAUDE.md` : index court qui pointe vers les skills.
import { SKILL_NAMES } from '../../catalog/schema.js';
import { pickText } from '../../catalog/text.js';
import type { RenderedFile } from '../types.js';
import { LANGUAGE_LABEL } from './i18n.js';
import { blocks, bullets, document, table } from './markdown.js';
import type { RenderModel } from './model.js';
import { skillPath } from './skills.js';

const DATABASE_LABEL: Record<string, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  oracle: 'Oracle',
};
const MIGRATIONS_LABEL: Record<string, string> = { flyway: 'Flyway', liquibase: 'Liquibase' };
const CI_LABEL: Record<string, string> = { github: 'GitHub Actions', gitlab: 'GitLab CI' };

function projectTable(model: RenderModel): string {
  const s = model.strings.claudeMd;
  const { scaffold, profile } = model.input;
  const labels = LANGUAGE_LABEL[model.language];
  const database =
    scaffold.stack.database === 'none'
      ? s.noDatabase
      : (DATABASE_LABEL[scaffold.stack.database] ?? scaffold.stack.database) +
        (scaffold.stack.migrations
          ? ` (${s.migrations} ${MIGRATIONS_LABEL[scaffold.stack.migrations] ?? scaffold.stack.migrations})`
          : '');
  return table(
    ['', ''],
    [
      [s.projectName, `\`${scaffold.project.name}\``],
      [s.basePackage, `\`${scaffold.project.base_package}\``],
      [s.java, String(scaffold.stack.java)],
      [s.database, database],
      [s.profile, `\`${profile.meta.id}\` — ${pickText(profile.meta.summary, model.language)}`],
      [s.security, `\`${scaffold.options.security}\``],
      [s.docker, scaffold.options.docker ? s.yes : s.no],
      [
        s.ci,
        scaffold.options.ci === 'none'
          ? s.none
          : (CI_LABEL[scaffold.options.ci] ?? scaffold.options.ci),
      ],
      [
        s.languages,
        s.commentsAndDocs(labels[scaffold.language.comments], labels[scaffold.language.docs]),
      ],
    ],
  );
}

function permanentRules(model: RenderModel): string {
  const coreWorkflow = model.skills.workflow.groups.find((g) => g.kind === 'core');
  const rules = coreWorkflow?.rules ?? [];
  return bullets(rules.map((r) => `**${r.id}** — ${r.statement}`));
}

function skillsTable(model: RenderModel): string {
  const s = model.strings;
  return table(
    [s.claudeMd.skillColumn, s.claudeMd.contentColumn, s.claudeMd.fileColumn],
    SKILL_NAMES.map((name) => [`\`${name}\``, s.skill.description[name], `\`${skillPath(name)}\``]),
  );
}

export function renderClaudeMd(model: RenderModel): RenderedFile {
  const s = model.strings.claudeMd;
  const { scaffold } = model.input;
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
    s.skillsIntro,
    skillsTable(model),
    `## ${s.readingRules}`,
    s.readingRulesLegend,
    bullets([s.enforcedLegend, s.guidanceLegend]),
    `## ${s.commands}`,
    bullets([
      `\`./mvnw verify\` — ${s.commandVerify}`,
      `\`./mvnw spring-boot:run -Dspring-boot.run.profiles=dev\` — ${s.commandRun}`,
      `\`./mvnw spotless:apply\` — ${s.commandFormat}`,
      `\`prepwork sync\` — ${s.commandSync}`,
    ]),
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
