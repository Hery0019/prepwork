// Captures du README (`pnpm shots`). Le script rejoue de vraies commandes de la CLI dans un
// dossier temporaire, capture la sortie par le `Reporter` injectable, puis la rend en SVG. Une
// image ne peut donc pas mentir : elle vient de `runCli`, pas d'une transcription recopiée.
//
// Le questionnaire interactif n'est pas capturé : @clack/prompts exige un vrai terminal, qu'un
// script ne peut pas fournir sans dépendance native.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../src/cli/program.js';
import type { Reporter } from '../src/cli/report.js';
import { createNodeCommandRunner } from '../src/cli/git.js';
import { PrepworkError } from '../src/errors.js';
import { createNodeFileSystem } from '../src/fs/node.js';
import { joinPath, toPosix } from '../src/fs/types.js';
import type { Prompter } from '../src/questionnaire/prompter.js';
import { TOOL_VERSION } from '../src/version.js';

const fs = createNodeFileSystem();
/** Dossier jetable où les commandes sont réellement exécutées. */
const workspace = toPosix(mkdtempSync(join(tmpdir(), 'prepwork-shots-')));

type Level = 'info' | 'warn' | 'error';

interface Line {
  level: Level;
  text: string;
}

interface Shot {
  /** Nom du fichier écrit sous `docs/img/`. */
  file: string;
  /** Commande affichée en tête de la carte, telle qu'on la taperait. */
  command: string;
  lines: Line[];
  /** Nombre de lignes gardées en tête et en pied quand la sortie est trop longue. */
  head?: number;
  tail?: number;
}

const SCAFFOLD = `scaffold_version: 1.2.0
project:
  name: pay-flow
  base_package: mg.solumada.payflow
  description: API de suivi des paiements
stack:
  target: spring-boot
  java: 21
  database: postgresql
  migrations: flyway
profile: layered
renderer: claude-code
options:
  security: session
  docker: true
  ci: github
git:
  author: { name: Hery, email: hery@example.com }
  agent_trailer: true
language: { comments: fr, docs: fr }
`;

/** Le questionnaire n'est jamais atteint : toutes les captures passent par `--scaffold`. */
function noPrompter(): Prompter {
  throw new PrepworkError('SCAFFOLD_INVALID', 'les captures ne passent pas par le questionnaire');
}

/**
 * Le dossier de travail est un temporaire de la machine qui génère : il n'a rien à faire dans
 * une image du README, et le lecteur n'y verrait qu'un chemin sans rapport avec son projet.
 */
function withoutWorkspace(text: string): string {
  return text.split(`${workspace}/`).join('').split(workspace).join('.');
}

function capture(): { reporter: Reporter; lines: Line[] } {
  const lines: Line[] = [];
  const push =
    (level: Level) =>
    (message: string): void => {
      for (const text of message.split('\n')) lines.push({ level, text: withoutWorkspace(text) });
    };
  return {
    lines,
    reporter: { info: push('info'), warn: push('warn'), error: push('error') },
  };
}

async function readOrFail(path: string): Promise<string> {
  const content = await fs.readText(path);
  if (content === undefined) throw new PrepworkError('SCAFFOLD_INVALID', `${path} introuvable`);
  return content;
}

async function run(cwd: string, args: readonly string[]): Promise<Line[]> {
  const { reporter, lines } = capture();
  await runCli(
    {
      fs: createNodeFileSystem(),
      prompter: noPrompter,
      commands: createNodeCommandRunner(),
      reporter,
      toolVersion: TOOL_VERSION,
      cwd,
    },
    [...args],
  );
  return lines;
}

// ── Rendu SVG ────────────────────────────────────────────────────────────────

const FONT_SIZE = 13;
const CHAR_WIDTH = 7.82; // largeur d'un caractère monospace à 13px, mesurée sur Consolas/Menlo
const LINE_HEIGHT = 20;
const PADDING_X = 16;
const PADDING_TOP = 44; // barre de titre comprise
const PADDING_BOTTOM = 16;
const MAX_COLUMNS = 124;

const COLORS = {
  background: '#11141a',
  border: '#272d38',
  bar: '#1a1f28',
  dots: ['#f7768e', '#e0af68', '#5fbf7f'],
  prompt: '#7aa2f7',
  command: '#e6edf3',
  info: '#c3cad6',
  done: '#5fbf7f',
  pending: '#7aa2f7',
  warn: '#e0af68',
  error: '#f7768e',
  muted: '#6b7484',
} as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(text: string): string {
  return text.length > MAX_COLUMNS ? `${text.slice(0, MAX_COLUMNS - 1)}…` : text;
}

/**
 * Une sortie de plan fait parfois cinquante lignes : on garde la tête et le pied, et le milieu
 * est remplacé par un repère explicite. Rien n'est masqué en silence.
 */
function elide(lines: readonly Line[], head: number, tail: number): Line[] {
  if (lines.length <= head + tail + 1) return [...lines];
  const hidden = lines.length - head - tail;
  return [
    ...lines.slice(0, head),
    { level: 'info', text: `  … ${hidden} lignes de plus …` },
    ...lines.slice(lines.length - tail),
  ];
}

function lineColor(line: Line): string {
  if (line.level === 'error') return COLORS.error;
  if (line.level === 'warn') return COLORS.warn;
  const trimmed = line.text.trimStart();
  if (trimmed.startsWith('✔')) return COLORS.done;
  if (trimmed.startsWith('•')) return COLORS.pending;
  if (trimmed.startsWith('…')) return COLORS.muted;
  return COLORS.info;
}

function toSvg(shot: Shot): string {
  const body = elide(shot.lines, shot.head ?? 8, shot.tail ?? 4).map((line) => ({
    ...line,
    text: truncate(line.text),
  }));
  const commandLine = `$ ${shot.command}`;
  const columns = Math.max(commandLine.length, ...body.map((l) => l.text.length), 40);
  const width = Math.ceil(columns * CHAR_WIDTH) + PADDING_X * 2;
  const height = PADDING_TOP + (body.length + 2) * LINE_HEIGHT + PADDING_BOTTOM;

  const rows: string[] = [
    `<text x="${PADDING_X}" y="${PADDING_TOP}" fill="${COLORS.prompt}">$ <tspan fill="${COLORS.command}">${escapeXml(shot.command)}</tspan></text>`,
  ];
  body.forEach((line, index) => {
    const y = PADDING_TOP + (index + 2) * LINE_HEIGHT;
    rows.push(
      `<text x="${PADDING_X}" y="${y}" fill="${lineColor(line)}">${escapeXml(line.text)}</text>`,
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(commandLine)}">
  <rect width="${width}" height="${height}" rx="8" fill="${COLORS.background}" stroke="${COLORS.border}"/>
  <path d="M0 8a8 8 0 0 1 8-8h${width - 16}a8 8 0 0 1 8 8v20H0z" fill="${COLORS.bar}"/>
  ${COLORS.dots.map((dot, i) => `<circle cx="${18 + i * 16}" cy="14" r="5" fill="${dot}"/>`).join('\n  ')}
  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace" font-size="${FONT_SIZE}" xml:space="preserve">
    ${rows.join('\n    ')}
  </g>
</svg>
`;
}

// ── Scénarios ────────────────────────────────────────────────────────────────

const outDir = toPosix(join(process.cwd(), 'docs', 'img'));

try {
  const project = joinPath(workspace, 'pay-flow');
  const scaffoldFile = joinPath(workspace, 'pay-flow.yaml');
  await fs.writeText(scaffoldFile, SCAFFOLD);

  const shots: Shot[] = [];

  shots.push({
    file: 'init.svg',
    command: 'prepwork init pay-flow --scaffold pay-flow.yaml',
    lines: await run(workspace, ['init', project, '--scaffold', scaffoldFile]),
    head: 9,
    tail: 5,
  });

  // Le projet vit ensuite sa vie : l'équipe touche un fichier généré et change une réponse.
  const service = joinPath(project, 'src/main/java/mg/solumada/payflow/service/NoteService.java');
  await fs.writeText(service, `${await readOrFail(service)}\n// TODO relire la pagination\n`);
  const scaffold = await readOrFail(joinPath(project, 'scaffold.yaml'));
  await fs.writeText(
    joinPath(project, 'scaffold.yaml'),
    scaffold.replace('security: session', 'security: none'),
  );

  shots.push({
    file: 'check.svg',
    command: 'prepwork check pay-flow',
    lines: await run(workspace, ['check', project]),
    head: 12,
    tail: 3,
  });

  shots.push({
    file: 'sync.svg',
    command: 'prepwork sync pay-flow',
    lines: await run(workspace, ['sync', project]),
    head: 12,
    tail: 3,
  });

  for (const shot of shots) {
    await fs.writeText(joinPath(outDir, shot.file), toSvg(shot));
    console.log(`docs/img/${shot.file} — ${shot.lines.length} lignes capturées`);
  }
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
