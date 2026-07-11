import { describe, expect, it } from 'vitest';
import type { PrepworkError } from '../../src/errors.js';
import { runQuestionnaire } from '../../src/packs/fastapi/questionnaire.js';
import type { QuestionnaireInput } from '../../src/packs/types.js';
import { createScriptedPrompter, type ScriptedAnswer } from '../../src/questionnaire/scripted.js';

const PROFILES: QuestionnaireInput['profiles'] = [
  { id: 'layered', summary: 'Monolithe en couches', whenToUse: ['une seule équipe'] },
];

/** Réponses dans l'ordre du questionnaire (ADR 0011 §9) pour le chemin par défaut. */
const DEFAULT_ANSWERS: ScriptedAnswer[] = [
  'pay-flow', // 1 nom
  'pay_flow', // 2 paquet Python
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

describe('fastapi questionnaire', () => {
  it('asks the questions in the documented order and builds the scaffold', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(result.scaffold).toEqual({
      scaffold_version: '1.2.0',
      project: { name: 'pay-flow', package_name: 'pay_flow', description: 'Flux de paiement' },
      stack: { target: 'fastapi', database: 'postgresql' },
      profile: 'layered',
      renderer: 'claude-code',
      options: { security: 'none', docker: true, ci: 'github' },
      git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
      language: { comments: 'fr', docs: 'fr' },
    });
    expect(result.extras).toEqual({});
  });

  it('never asks for the toolchain: the tool pins it', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    await runQuestionnaire(prompter, { profiles: PROFILES });

    for (const pinned of ['uv', 'ruff', 'mypy', 'SQLAlchemy', 'Alembic']) {
      expect(
        prompter.asked.some((message) => message.toLowerCase().includes(pinned.toLowerCase())),
        `${pinned} est épinglé par l'outil, jamais demandé`,
      ).toBe(false);
    }
    // `Python` apparaît, mais pour nommer le paquet — jamais pour en choisir la version.
    expect(prompter.asked.some((message) => /python\s*3|version/i.test(message))).toBe(false);
  });

  it('proposes a package name derived from the project name', async () => {
    // Une réponse vide accepte la proposition par défaut.
    const answers = [...DEFAULT_ANSWERS];
    answers[1] = '';
    const prompter = createScriptedPrompter(answers);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(result.scaffold.project.package_name).toBe('pay_flow');
  });

  it('refuses a package name that is not snake_case', async () => {
    const answers = [...DEFAULT_ANSWERS];
    answers[1] = 'PayFlow';
    const prompter = createScriptedPrompter(answers);

    const error = await runQuestionnaire(prompter, { profiles: PROFILES }).catch(
      (cause: unknown) => cause,
    );

    expect((error as PrepworkError).message).toContain('snake_case');
  });

  it('refuses a package name that is a Python keyword', async () => {
    // Les mots-clés Python sont en minuscules : contrairement à C#, le motif ne les exclut pas.
    const answers = [...DEFAULT_ANSWERS];
    answers[1] = 'import';
    const prompter = createScriptedPrompter(answers);

    const error = await runQuestionnaire(prompter, { profiles: PROFILES }).catch(
      (cause: unknown) => cause,
    );

    expect((error as PrepworkError).message).toContain('mot-clé Python');
  });

  it('announces the only profile instead of asking for it', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(prompter.asked.some((message) => message.includes("Profil d'architecture"))).toBe(false);
    expect(prompter.notes.join('\n')).toContain('Monolithe en couches');
  });

  it('asks for the OIDC issuer only for oauth2, and keeps it out of the scaffold', async () => {
    const answers = [...DEFAULT_ANSWERS];
    answers[4] = 'oauth2-resource-server';
    answers.splice(5, 0, 'https://auth.example.com/realms/app');
    const prompter = createScriptedPrompter(answers);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(result.scaffold.options.security).toBe('oauth2-resource-server');
    expect(result.extras.envOverrides).toEqual({
      OIDC_ISSUER: 'https://auth.example.com/realms/app',
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
