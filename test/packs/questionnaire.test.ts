import { describe, expect, it } from 'vitest';
import type { PrepworkError } from '../../src/errors.js';
import { runQuestionnaire, type ProfileChoice } from '../../src/packs/spring-boot/questionnaire.js';
import { createScriptedPrompter, type ScriptedAnswer } from '../../src/questionnaire/scripted.js';

const PROFILES: ProfileChoice[] = [
  { id: 'layered', summary: 'Layered monolith', whenToUse: ['small team'] },
  { id: 'modular', summary: 'Modular monolith', whenToUse: ['several domains'] },
];

/** Réponses dans l'ordre du questionnaire (CLAUDE.md §5) pour le chemin par défaut. */
const DEFAULT_ANSWERS: ScriptedAnswer[] = [
  'pay-flow', // 1 nom
  'mg.solumada.payflow', // 2 package
  'Payment flows', // 3 description
  21, // 4 java
  'postgresql', // 5 base
  'flyway', // 5a migrations
  'layered', // 6 profil
  'none', // 7 sécurité
  true, // 8 docker
  'github', // 9 ci
  'Hery', // 10 nom
  'hery@example.com', // 10 email
  true, // 11 trailer
  'fr', // 12 commentaires
  'fr', // 13 docs
  true, // 14 confirmation
];

describe('questionnaire', () => {
  it('asks the questions in the documented order and builds the scaffold', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);
    const result = await runQuestionnaire(prompter, { profiles: PROFILES });
    expect(result.scaffold).toEqual({
      scaffold_version: '1.1.0',
      project: {
        name: 'pay-flow',
        base_package: 'mg.solumada.payflow',
        description: 'Payment flows',
      },
      stack: { target: 'spring-boot', java: 21, database: 'postgresql', migrations: 'flyway' },
      profile: 'layered',
      options: { security: 'none', docker: true, ci: 'github' },
      git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
      language: { comments: 'fr', docs: 'fr' },
    });
    expect(result.extras).toEqual({});
    expect(prompter.asked.map((q) => q.split('.')[0])).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '5a',
      '6',
      '7',
      '8',
      '9',
      '10',
      '10',
      '11',
      '12',
      '13',
      'Générer le projet avec ces choix ?',
    ]);
    expect(prompter.notes.some((n) => n.includes('small team'))).toBe(true);
    expect(prompter.notes.some((n) => n.includes('Récapitulatif') || n.includes('pay-flow'))).toBe(
      true,
    );
  });

  it('skips migrations without a database, asks the issuer for oauth2 and warns about Oracle', async () => {
    const prompter = createScriptedPrompter([
      'inventory',
      'com.example.inventory',
      'Stock',
      17,
      'oracle',
      'liquibase',
      'modular',
      'oauth2-resource-server',
      'https://auth.example.com/realms/app',
      false,
      'gitlab',
      'Jane',
      'jane@example.com',
      false,
      'en',
      'en',
      true,
    ]);
    const result = await runQuestionnaire(prompter, { profiles: PROFILES });
    expect(result.scaffold.stack).toEqual({
      target: 'spring-boot',
      java: 17,
      database: 'oracle',
      migrations: 'liquibase',
    });
    expect(result.scaffold.options).toEqual({
      security: 'oauth2-resource-server',
      docker: false,
      ci: 'gitlab',
    });
    expect(result.extras).toEqual({
      envOverrides: { OAUTH2_ISSUER_URI: 'https://auth.example.com/realms/app' },
    });
    expect(prompter.notes.some((n) => n.includes('Oracle'))).toBe(true);

    const noDb = createScriptedPrompter([
      'inventory',
      'com.example.inventory',
      'Stock',
      21,
      'none',
      'layered',
      'none',
      true,
      'none',
      'Jane',
      'jane@example.com',
      true,
      'fr',
      'en',
      true,
    ]);
    const withoutDb = await runQuestionnaire(noDb, { profiles: PROFILES });
    expect(withoutDb.scaffold.stack).toEqual({ target: 'spring-boot', java: 21, database: 'none' });
    expect(noDb.asked.some((q) => q.startsWith('5a'))).toBe(false);
  });

  it('prefills the git identity and validates answers', async () => {
    const prompter = createScriptedPrompter([
      ...DEFAULT_ANSWERS.slice(0, 10),
      '',
      '',
      ...DEFAULT_ANSWERS.slice(12),
    ]);
    const result = await runQuestionnaire(prompter, {
      profiles: PROFILES,
      gitIdentity: { name: 'Hery R.', email: 'hery@solumada.mg' },
    });
    expect(result.scaffold.git.author).toEqual({ name: 'Hery R.', email: 'hery@solumada.mg' });

    const badPackage = createScriptedPrompter([
      'pay-flow',
      'mg.solumada.package',
      ...DEFAULT_ANSWERS.slice(2),
    ]);
    await expect(runQuestionnaire(badPackage, { profiles: PROFILES })).rejects.toThrow(
      /mot réservé/,
    );

    const badName = createScriptedPrompter(['PayFlow', ...DEFAULT_ANSWERS.slice(1)]);
    await expect(runQuestionnaire(badName, { profiles: PROFILES })).rejects.toThrow(/kebab-case/);
  });

  it('cancels cleanly when the summary is not confirmed', async () => {
    const prompter = createScriptedPrompter([...DEFAULT_ANSWERS.slice(0, -1), false]);
    const error = await runQuestionnaire(prompter, { profiles: PROFILES }).catch((e: unknown) => e);
    expect((error as PrepworkError).code).toBe('CANCELLED');
  });
});
