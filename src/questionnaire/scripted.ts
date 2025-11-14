// Prompteur scripté pour les tests : consomme une liste de réponses dans l'ordre des questions.
// Une réponse refusée par la validation fait échouer le test au lieu de boucler.
import { PrepworkError } from '../errors.js';
import type { Prompter } from './prompter.js';

export type ScriptedAnswer = string | number | boolean;

export interface ScriptedPrompter extends Prompter {
  /** Journal des messages posés, pour vérifier l'ordre des questions. */
  readonly asked: string[];
  readonly notes: string[];
}

export function createScriptedPrompter(answers: readonly ScriptedAnswer[]): ScriptedPrompter {
  const queue = [...answers];
  const asked: string[] = [];
  const notes: string[] = [];
  const next = (message: string): ScriptedAnswer => {
    asked.push(message);
    const answer = queue.shift();
    if (answer === undefined) {
      throw new PrepworkError('CANCELLED', `aucune réponse scriptée pour « ${message} »`);
    }
    return answer;
  };
  return {
    asked,
    notes,
    intro() {
      // rien à afficher dans les tests
    },
    note(message) {
      notes.push(message);
    },
    text(prompt) {
      const raw = next(prompt.message);
      const value = String(raw === '' ? (prompt.initialValue ?? '') : raw);
      const problem = prompt.validate?.(value);
      if (problem !== undefined) {
        throw new PrepworkError('CANCELLED', `réponse « ${value} » refusée : ${problem}`);
      }
      return Promise.resolve(value);
    },
    select(prompt) {
      const raw = next(prompt.message);
      const option = prompt.options.find((o) => o.value === raw);
      if (!option) {
        throw new PrepworkError(
          'CANCELLED',
          `réponse « ${String(raw)} » hors des choix (${prompt.options.map((o) => String(o.value)).join(', ')})`,
        );
      }
      return Promise.resolve(option.value);
    },
    confirm(prompt) {
      const raw = next(prompt.message);
      return Promise.resolve(Boolean(raw));
    },
    outro() {
      // rien à afficher dans les tests
    },
  };
}
