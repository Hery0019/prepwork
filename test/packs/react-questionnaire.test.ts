import { describe, expect, it } from 'vitest';
import type { PrepworkError } from '../../src/errors.js';
import { runQuestionnaire, type ProfileChoice } from '../../src/packs/react/questionnaire.js';
import { createScriptedPrompter, type ScriptedAnswer } from '../../src/questionnaire/scripted.js';

const PROFILES: ProfileChoice[] = [
  { id: 'spa-feature', summary: 'Vite single-page application', whenToUse: ['one HTTP API'] },
  { id: 'next-app', summary: 'Next.js App Router', whenToUse: ['server rendering'] },
];

const ONE_PROFILE: ProfileChoice[] = PROFILES.filter((profile) => profile.id === 'spa-feature');

/** Réponses dans l'ordre du questionnaire (ADR 0007 §7) pour le chemin par défaut. */
const DEFAULT_ANSWERS: ScriptedAnswer[] = [
  'note-book', // 1 nom
  'Interface de gestion de notes', // 2 description
  'spa-feature', // 3 profil
  'tanstack-query', // 4 données
  'rhf', // 5 formulaires
  'zustand', // 6 état client
  'none', // 7 authentification
  false, // 8 i18n
  true, // 9 e2e
  true, // 10 docker
  'github', // 11 ci
  'app-sober', // 12 preset
  true, // 13 thème sombre
  'Hery', // 14 nom
  'hery@example.com', // 14 email
  true, // 15 trailer
  'fr', // 16 commentaires
  'fr', // 17 docs
  true, // 18 confirmation
];

describe('react questionnaire', () => {
  it('asks the questions in the documented order and builds the scaffold', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(result.scaffold).toEqual({
      scaffold_version: '1.2.0',
      project: { name: 'note-book', description: 'Interface de gestion de notes' },
      stack: { target: 'react', data: 'tanstack-query', forms: 'rhf' },
      profile: 'spa-feature',
      renderer: 'claude-code',
      options: {
        state: 'zustand',
        security: 'none',
        i18n: false,
        e2e: true,
        docker: true,
        ci: 'github',
      },
      design: { preset: 'app-sober', dark: true },
      git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
      language: { comments: 'fr', docs: 'fr' },
    });
    expect(result.extras).toEqual({});
  });

  it('announces the only profile instead of asking for it', async () => {
    const answers = DEFAULT_ANSWERS.filter((answer) => answer !== 'spa-feature');
    const prompter = createScriptedPrompter(answers);

    await runQuestionnaire(prompter, { profiles: ONE_PROFILE });

    expect(prompter.asked.some((message) => message.includes("Profil d'architecture"))).toBe(false);
    expect(prompter.notes.join('\n')).toContain('Vite single-page application');
  });

  it('asks for the profile as soon as the catalogue offers several', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(prompter.asked.some((message) => message.includes("Profil d'architecture"))).toBe(true);
    expect(result.scaffold.profile).toBe('spa-feature');
  });

  it('asks for the login path only for the backend-for-frontend, and keeps it out of the scaffold', async () => {
    const answers = [...DEFAULT_ANSWERS];
    answers[6] = 'oidc-bff';
    answers.splice(7, 0, '/auth/login');
    const prompter = createScriptedPrompter(answers);

    const result = await runQuestionnaire(prompter, { profiles: PROFILES });

    expect(result.scaffold.options.security).toBe('oidc-bff');
    expect(result.extras.envOverrides).toEqual({ VITE_AUTH_LOGIN_PATH: '/auth/login' });
    expect(JSON.stringify(result.scaffold)).not.toContain('/auth/login');
  });

  it('shows the visual contract in the summary before confirming', async () => {
    const prompter = createScriptedPrompter(DEFAULT_ANSWERS);

    await runQuestionnaire(prompter, { profiles: PROFILES });

    const recap = prompter.notes.at(-1) ?? '';
    expect(recap).toContain('app-sober');
    expect(recap).toContain('échelle 1.200');
    expect(recap).toContain('thème sombre');
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
