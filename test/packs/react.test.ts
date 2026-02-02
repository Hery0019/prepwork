import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog } from '../../src/catalog/load.js';
import { validateCatalog } from '../../src/catalog/validate.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { DESIGN_PRESETS } from '../../src/packs/react/design.js';
import { reactPack } from '../../src/packs/react/index.js';
import { resolveOptionIds, ScaffoldSchema } from '../../src/packs/react/scaffold.js';

const SCAFFOLD = {
  scaffold_version: '1.2.0',
  project: { name: 'note-book', description: 'Notes management interface' },
  stack: { target: 'react', data: 'tanstack-query', forms: 'rhf' },
  profile: 'spa-feature',
  renderer: 'claude-code',
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
};

describe('react scaffold', () => {
  it('accepts the documented example and defaults the stack target', () => {
    const parsed = ScaffoldSchema.parse({
      ...SCAFFOLD,
      stack: { data: 'tanstack-query', forms: 'rhf' },
    });
    expect(parsed.stack.target).toBe('react');
  });

  it('resolves the options declared in the scaffold, in catalogue order', () => {
    expect(resolveOptionIds(ScaffoldSchema.parse(SCAFFOLD))).toEqual([
      'data-tanstack-query',
      'forms-rhf',
      'state-zustand',
      'security-oidc-bff',
      'e2e-playwright',
      'docker',
      'ci-github',
      'git',
    ]);
  });

  it('drops the optional options and keeps git when everything is off', () => {
    const minimal = ScaffoldSchema.parse({
      ...SCAFFOLD,
      stack: { target: 'react', data: 'none', forms: 'none' },
      options: {
        state: 'context',
        security: 'none',
        i18n: false,
        e2e: false,
        docker: false,
        ci: 'none',
      },
    });
    expect(resolveOptionIds(minimal)).toEqual([
      'data-none',
      'forms-none',
      'state-context',
      'security-none',
      'git',
    ]);
  });
});

describe('the shipped react content', () => {
  it('loads and passes the consistency check without errors', async () => {
    const catalog = await loadCatalog(createNodeFileSystem(), defaultContentRoot(), reactPack);
    expect(catalog.core.ruleSets.map((s) => s.id)).toEqual([
      'a11y',
      'components',
      'data',
      'forms',
      'language',
      'security',
      'style',
      'testing',
      'workflow',
    ]);
    expect([...catalog.profiles.keys()].sort()).toEqual(['next-app', 'spa-feature']);

    const diagnostics = validateCatalog(catalog, reactPack);
    const errors = diagnostics.filter((d) => d.level === 'error');
    expect(errors, errors.map((e) => `${e.source}: ${e.message}`).join('\n')).toEqual([]);
  });

  it('resolves every option the scaffold can ask for', async () => {
    const catalog = await loadCatalog(createNodeFileSystem(), defaultContentRoot(), reactPack);
    const declared = [
      'data-tanstack-query',
      'data-none',
      'forms-rhf',
      'forms-none',
      'state-zustand',
      'state-context',
      'security-none',
      'security-oidc-bff',
      'security-session',
      'i18n',
      'e2e-playwright',
      'docker',
      'ci-github',
      'ci-gitlab',
      'git',
    ];
    expect([...catalog.options.keys()].sort()).toEqual([...declared].sort());
  });
});

/** Le contrat visuel promet un contraste AA : la promesse est vérifiée, pas seulement écrite. */
describe('design presets', () => {
  const channel = (value: number): number => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = (hex: string): number => {
    const n = parseInt(hex.slice(1), 16);
    return (
      0.2126 * channel((n >> 16) & 255) +
      0.7152 * channel((n >> 8) & 255) +
      0.0722 * channel(n & 255)
    );
  };
  const contrast = (a: string, b: string): number => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
  };

  const pairs: [string, string][] = [
    ['text', 'background'],
    ['text', 'surface'],
    ['muted', 'background'],
    ['muted', 'surface'],
    ['primary-foreground', 'primary'],
    ['primary', 'background'],
    ['destructive', 'background'],
    ['success', 'background'],
  ];

  for (const [id, preset] of Object.entries(DESIGN_PRESETS)) {
    for (const theme of ['light', 'dark'] as const) {
      it(`${id}_${theme}_keepsTextContrastAboveAA`, () => {
        for (const [foreground, background] of pairs) {
          const ratio = contrast(
            preset[theme][foreground] ?? '#000000',
            preset[theme][background] ?? '#ffffff',
          );
          expect(ratio, `${id} ${theme} ${foreground} sur ${background}`).toBeGreaterThanOrEqual(
            4.5,
          );
        }
      });
    }
  }
});
