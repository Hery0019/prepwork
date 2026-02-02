// Rendu du pack `react` (étape 8) : tant que le squelette n'existe pas, la sortie est faite des
// seuls fichiers du renderer — `CLAUDE.md` et les sept skills. Ces golden files sont le filet
// de l'étape 10 : un template ajouté ne doit pas changer la spécification déjà relue.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog, type Catalog } from '../../src/catalog/load.js';
import { compose } from '../../src/engine/compose.js';
import { renderProject } from '../../src/engine/render.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { reactPack } from '../../src/packs/react/index.js';
import { ScaffoldSchema } from '../../src/packs/react/scaffold.js';
import { claudeCodeRenderer } from '../../src/renderers/index.js';
import { expectGolden } from '../helpers/golden.js';

const goldenRoot = join(import.meta.dirname, 'golden');
const COMPOSE_OPTIONS = { toolVersion: '0.1.0', today: '2026-09-03' };

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog(createNodeFileSystem(), defaultContentRoot(), reactPack);
  return cached;
}

const FULL = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'note-book', description: 'Interface de gestion de notes' },
  stack: { target: 'react', data: 'tanstack-query', forms: 'rhf' },
  profile: 'spa-feature',
  renderer: 'claude-code',
  options: {
    state: 'zustand',
    security: 'oidc-bff',
    i18n: true,
    e2e: true,
    docker: true,
    ci: 'github',
  },
  design: { preset: 'app-sober', dark: true },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
});

const MINIMAL = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'kiosk', description: 'Read-only dashboard' },
  stack: { target: 'react', data: 'none', forms: 'none' },
  profile: 'spa-feature',
  renderer: 'claude-code',
  options: {
    state: 'context',
    security: 'none',
    i18n: false,
    e2e: false,
    docker: false,
    ci: 'none',
  },
  design: { preset: 'dense', dark: false },
  git: { author: { name: 'Jane', email: 'jane@example.com' }, agent_trailer: false },
  language: { comments: 'en', docs: 'en' },
});

const NEXT = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'note-board', description: 'Interface rendue sur le serveur' },
  stack: { target: 'react', data: 'none', forms: 'none' },
  profile: 'next-app',
  renderer: 'claude-code',
  options: {
    state: 'context',
    security: 'oidc-bff',
    i18n: false,
    e2e: false,
    docker: true,
    ci: 'github',
  },
  design: { preset: 'app-sober', dark: true },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
});

describe('react project rendering (next-app)', () => {
  it('renders the App Router skeleton — golden', async () => {
    const composition = compose(await catalog(), NEXT, reactPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'react-next-app-fr'), files);

    const paths = files.map((f) => f.path);
    // Le démarrage vient du socle, conditionné par le profil : pas de Vite ici.
    expect(paths).toContain('next.config.ts');
    expect(paths).toContain('src/app/layout.tsx');
    expect(paths).toContain('src/features/notes/api/actions.ts');
    expect(paths).not.toContain('vite.config.ts');
    expect(paths).not.toContain('index.html');
    // L'option docker sert la sortie déclarée par le profil, sans le nommer.
    const dockerfile = files.find((f) => f.path === 'Dockerfile')?.content ?? '';
    expect(dockerfile).toContain('"server.js"');
    expect(paths).not.toContain('nginx.conf');
  });
});

describe('react project rendering (spa-feature)', () => {
  it('renders the full variant (TanStack Query, forms, zustand, OIDC, i18n, e2e, fr) — golden', async () => {
    const composition = compose(await catalog(), FULL, reactPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'react-spa-full-fr'), files);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('CLAUDE.md');
    expect(paths).toContain('.claude/skills/ui/SKILL.md');
    expect(paths).toContain('.claude/skills/a11y/SKILL.md');

    const ui = files.find((f) => f.path === '.claude/skills/ui/SKILL.md')?.content ?? '';
    expect(ui, 'le contrat visuel est dans le skill ui').toContain('--color-primary');
    expect(ui).toContain('1.200');
  });

  it('renders the minimal variant (no data library, no CI, dense preset, en) — golden', async () => {
    const composition = compose(await catalog(), MINIMAL, reactPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'react-spa-minimal-en'), files);

    const claudeMd = files.find((f) => f.path === 'CLAUDE.md')?.content ?? '';
    expect(claudeMd).toContain('`spa-feature`');
    expect(claudeMd, "l'exemple d'identifiant vient du profil").toContain('`SPA-002`');
  });
});
