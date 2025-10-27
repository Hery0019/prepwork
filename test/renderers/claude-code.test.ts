import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog } from '../../src/catalog/load.js';
import type { Option } from '../../src/catalog/schema.js';
import { OptionSchema } from '../../src/catalog/schema.js';
import type { Scaffold } from '../../src/config/schema.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { claudeCodeRenderer, getRenderer } from '../../src/renderers/index.js';
import type { RenderInput } from '../../src/renderers/types.js';
import { SAMPLE_SCAFFOLD } from '../helpers/fixtures.js';
import { expectGolden } from '../helpers/golden.js';

const goldenRoot = join(import.meta.dirname, 'golden', 'claude-code');

async function inputFor(scaffold: Scaffold, options: Option[] = []): Promise<RenderInput> {
  const catalog = await loadCatalog(createNodeFileSystem(), defaultContentRoot());
  const profile = catalog.profiles.get(scaffold.profile);
  if (!profile) throw new Error(`profil ${scaffold.profile} absent`);
  return {
    scaffold,
    core: catalog.core.ruleSets,
    profile: profile.profile,
    options,
    toolVersion: '0.1.0',
  };
}

const sampleOption = OptionSchema.parse({
  meta: {
    id: 'sample-option',
    version: '1.0.0',
    rule_prefix: 'SMP',
    summary: { en: 'A sample option.', fr: 'Une option exemple.' },
  },
  skill: 'security',
  rules: [
    {
      id: 'SMP-001',
      statement: { en: 'Sample rule.', fr: 'Règle exemple.' },
      rationale: { en: 'Because.', fr: 'Parce que.' },
      enforced_by: 'gitleaks',
    },
  ],
  env: [
    {
      name: 'SAMPLE_URL',
      example: 'https://example.test',
      comment: { en: 'Sample URL.', fr: 'URL exemple.' },
    },
  ],
});

describe('claude-code renderer', () => {
  it('is registered under its id', () => {
    expect(getRenderer('claude-code')).toBe(claudeCodeRenderer);
    expect(() => getRenderer('cursor')).toThrow(/renderer inconnu/);
  });

  it('produces CLAUDE.md and the six skills (fr, layered, defaults)', async () => {
    const files = claudeCodeRenderer.render(await inputFor(SAMPLE_SCAFFOLD));
    expect(files.map((f) => f.path)).toEqual([
      'CLAUDE.md',
      '.claude/skills/architecture/SKILL.md',
      '.claude/skills/db/SKILL.md',
      '.claude/skills/api/SKILL.md',
      '.claude/skills/testing/SKILL.md',
      '.claude/skills/workflow/SKILL.md',
      '.claude/skills/security/SKILL.md',
    ]);
    await expectGolden(join(goldenRoot, 'layered-fr'), files);
  });

  it('renders in English with an option contributing rules and env vars', async () => {
    const scaffold: Scaffold = {
      ...SAMPLE_SCAFFOLD,
      stack: { java: 17, database: 'none' },
      options: { security: 'oauth2-resource-server', docker: false, ci: 'none' },
      git: { ...SAMPLE_SCAFFOLD.git, agent_trailer: false },
      language: { comments: 'en', docs: 'en' },
    };
    const files = claudeCodeRenderer.render(await inputFor(scaffold, [sampleOption]));
    await expectGolden(join(goldenRoot, 'layered-en'), files);
  });

  it('makes the tooled / guidance distinction visible and substitutes the base package', async () => {
    const files = claudeCodeRenderer.render(await inputFor(SAMPLE_SCAFFOLD));
    const architecture = files.find((f) => f.path.endsWith('architecture/SKILL.md'))?.content ?? '';
    expect(architecture).toContain('**LAY-002** · `archunit` —');
    expect(architecture).toContain('**LAY-AP-002** · guidance —');
    expect(architecture).toContain('`mg.solumada.payflow.web`');
    expect(architecture).toContain('src/main/java/mg/solumada/payflow/domain/Note.java');
    expect(architecture).not.toContain('{{basePackage}}');

    const claudeMd = files[0]?.content ?? '';
    expect(claudeMd).toContain('**CORE-001** —');
    expect(claudeMd).toContain('Co-Authored-By: Claude <noreply@anthropic.com>');
    for (const file of files) {
      expect(file.content.endsWith('\n')).toBe(true);
      expect(file.content).not.toMatch(/\n\n\n/);
    }
  });
});
