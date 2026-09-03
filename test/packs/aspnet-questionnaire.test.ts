import { describe, expect, it } from 'vitest';
import type { PrepworkError } from '../../src/errors.js';
import { runQuestionnaire, type ProfileChoice } from '../../src/packs/aspnet/questionnaire.js';
import { createScriptedPrompter, type ScriptedAnswer } from '../../src/questionnaire/scripted.js';

const PROFILES: ProfileChoice[] = [
  { id: 'layered', summary: 'Monolithe en couches', whenToUse: ['une seule équipe'] },
];

/** Réponses dans l'ordre du questionnaire (ADR 0010) pour le chemin par défaut. */
const DEFAULT_ANSWERS: ScriptedAnswer[] = [
  'pay-flow', // 1 nom
  'Solumada.PayFlow', // 2 espace de noms racine
  'Flux de paiement', // 3 description
  'postgresql', // 4 base
  // 5 profil : annoncé, pas demandé
  'none', // 6 authentification
  true, // 7 docker
  'github', // 8 ci
  'Hery', // 9 nom
  'hery@example.com', // 9 email
  true, // 10 trailer
  'fr', // 11 commentaires
  'fr', // 12 docs
  true, // 13 confirmation
];

describe('aspnet questionnaire', () => {
  it('asks the questions in the documented order and builds the scaffold', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(result.scaffold).toEqual({
      scaffold_version: '1.2.0',
      project: {
        name: 'pay-flow',
        root_namespace: 'Solumada.PayFlow',
        description: 'Flux de paiement',
      },
      stack: { target: 'aspnet', database: 'postgresql' },
      profile: 'layered',
      renderer: 'claude-code',
      options: { security: 'none', docker: true, ci: 'github' },
      git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
      language: { comments: 'fr', docs: 'fr' },
    });
    expect(result.extras).toEqual({});
  });

  it('never asks for the SDK version: the tool pins it', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(prompter.asked.some((message) => message.includes('.NET'))).toBe(false);
    expect(prompter.asked.some((message) => message.toLowerCase().includes('sdk'))).toBe(false);
  });

  it('proposes a root namespace derived from the project name', async () => {
    // Une réponse vide accepte la proposition par défaut.
    const answers = [...DEFAULT_ANSWERS];
    answers[1] = '';
    const prompter = createScriptedPrompter(answers);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(result.scaffold.project.root_namespace).toBe('PayFlow');
  });

  it('refuses a namespace that is not PascalCase', async () => {
    const answers = [...DEFAULT_ANSWERS];
    answers[1] = 'solumada.payflow';
    const prompter = createScriptedPrompter(answers);

    const error = await runQuestionnaire(prompter, { profiles: PROFILES }).catch(
      (cause: unknown) => cause,
    );

    expect((error as PrepworkError).message).toContain('PascalCase');
  });

  it('announces the only profile instead of asking for it', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(prompter.asked.some((message) => message.includes("Profil d'architecture"))).toBe(false);
    expect(prompter.notes.join('\n')).toContain('Monolithe en couches');
  });

  it('asks for the OIDC authority only for jwt-bearer, and keeps it out of the scaffold', async () => {
    const answers = [...DEFAULT_ANSWERS];
    answers[4] = 'jwt-bearer';
    answers.splice(5, 0, 'https://auth.example.com/realms/app');
    const prompter = createScriptedPrompter(answers);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(result.scaffold.options.security).toBe('jwt-bearer');
    expect(result.extras.envOverrides).toEqual({
      JWT_AUTHORITY: 'https://auth.example.com/realms/app',
    });
    expect(JSON.stringify(result.scaffold)).not.toContain('auth.example.com');
  });

  it('cancels when the summary is refused', async () => {
    const answers = [...DEFAULT_ANSWERS];
    answers[answers.length - 1] = false;
    const prompter = createScriptedPrompter(answers);

    const error = await runQuestionnaire(prompter, { profiles: PROFILES }).catch(
      (cause: unknown) => cause,
    );

    expect((error as PrepworkError).code).toBe('CANCELLED');
  });
});
