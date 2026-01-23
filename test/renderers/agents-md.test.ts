// Le renderer `agents-md` est la preuve du troisième axe (CLAUDE.md §2) : la même définition YAML
// doit produire une autre cible d'agent, pour les deux packs, sans qu'aucun d'eux le sache.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog } from '../../src/catalog/load.js';
import type { BaseScaffold } from '../../src/config/schema.js';
import { compose } from '../../src/engine/compose.js';
import { renderProject } from '../../src/engine/render.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import type { StackPack } from '../../src/packs/types.js';
import { reactPack } from '../../src/packs/react/index.js';
import { ScaffoldSchema as ReactScaffoldSchema } from '../../src/packs/react/scaffold.js';
import { springBootPack } from '../../src/packs/spring-boot/index.js';
import { agentsMdRenderer, claudeCodeRenderer } from '../../src/renderers/index.js';
import { SAMPLE_SCAFFOLD } from '../helpers/fixtures.js';
import { expectGolden } from '../helpers/golden.js';

const goldenRoot = join(import.meta.dirname, 'golden', 'agents-md');
const COMPOSE_OPTIONS = { toolVersion: '0.1.0', today: '2026-09-03' };

const REACT_SCAFFOLD = ReactScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'note-book', description: 'Interface de gestion de notes' },
  stack: { target: 'react', data: 'tanstack-query', forms: 'rhf' },
  profile: 'spa-feature',
  renderer: 'agents-md',
  options: {
    state: 'zustand',
    security: 'oidc-bff',
    i18n: false,
    e2e: true,
    docker: true,
    ci: 'github',
  },
  design: { preset: 'app-sober', dark: true },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
});

async function render(scaffold: BaseScaffold, pack: StackPack, renderer = agentsMdRenderer) {
  const catalog = await loadCatalog(createNodeFileSystem(), defaultContentRoot(), pack);
  const composition = compose(catalog, scaffold, pack, COMPOSE_OPTIONS);
  return renderProject(composition, renderer);
}

describe('agents-md renderer', () => {
  it('renders one AGENTS.md for a Spring Boot project — golden', async () => {
    const files = await render({ ...SAMPLE_SCAFFOLD, renderer: 'agents-md' }, springBootPack);

    const specs = files.filter((f) => f.path.endsWith('.md') && !f.path.startsWith('docs/'));
    expect(specs.map((f) => f.path)).toEqual(['AGENTS.md', 'README.md']);

    const agents = files.find((f) => f.path === 'AGENTS.md');
    expect(agents, 'AGENTS.md rendu').toBeDefined();
    expect(agents?.owner).toBe('generated');
    await expectGolden(join(goldenRoot, 'spring-layered-fr'), agents === undefined ? [] : [agents]);
  });

  it('renders one AGENTS.md for a React project — golden', async () => {
    const files = await render(REACT_SCAFFOLD, reactPack);
    const agents = files.find((f) => f.path === 'AGENTS.md');
    expect(agents, 'AGENTS.md rendu').toBeDefined();

    await expectGolden(join(goldenRoot, 'react-spa-fr'), agents === undefined ? [] : [agents]);

    const content = agents?.content ?? '';
    // Les sujets du pack deviennent les sections du document.
    for (const topic of ['## Architecture', '## Composants et style', '## Accessibilité']) {
      expect(content, topic).toContain(topic);
    }
    // Le contrat visuel et les couches y sont, comme dans les skills.
    expect(content).toContain('--color-primary');
    expect(content).toContain('`src/features/*`');
  });

  it('changes only the specification files, never the skeleton', async () => {
    const asClaude = await render(
      { ...REACT_SCAFFOLD, renderer: 'claude-code' },
      reactPack,
      claudeCodeRenderer,
    );
    const asAgents = await render(REACT_SCAFFOLD, reactPack);

    const specs = (paths: string[]) =>
      paths.filter((p) => p === 'AGENTS.md' || p === 'CLAUDE.md' || p.startsWith('.claude/'));
    const skeleton = (paths: string[]) => paths.filter((p) => !specs([p]).length);

    expect(skeleton(asAgents.map((f) => f.path))).toEqual(skeleton(asClaude.map((f) => f.path)));
    expect(specs(asAgents.map((f) => f.path))).toEqual(['AGENTS.md']);
    expect(specs(asClaude.map((f) => f.path))).toContain('.claude/skills/ui/SKILL.md');
  });

  it('carries every rule of the claude-code skills into the single file', async () => {
    const asClaude = await render(
      { ...REACT_SCAFFOLD, renderer: 'claude-code' },
      reactPack,
      claudeCodeRenderer,
    );
    const asAgents = await render(REACT_SCAFFOLD, reactPack);

    const ids = (text: string): string[] => [
      ...new Set(
        text.match(/\*\*(?:CORE|SPA|QRY|FRM|ZUS|SECO|PLAY|DOCK|CIGH|GIT)-[A-Z0-9-]+\*\*/g) ?? [],
      ),
    ];
    const fromSkills = ids(
      asClaude
        .filter((f) => f.path.startsWith('.claude/skills/'))
        .map((f) => f.content)
        .join('\n'),
    );
    const fromAgents = ids(asAgents.find((f) => f.path === 'AGENTS.md')?.content ?? '');

    expect(fromSkills.length).toBeGreaterThan(50);
    expect(fromAgents.sort()).toEqual(fromSkills.sort());
  });
});
