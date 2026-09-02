// Prompteur interactif fondé sur @clack/prompts. Une annulation (Ctrl+C) devient une
// PrepworkError `CANCELLED` que la CLI traduit en sortie propre.
import * as clack from '@clack/prompts';
import { PrepworkError } from '../errors.js';
import type { Prompter, SelectPrompt, TextPrompt } from './prompter.js';

function unwrap<T>(value: T | symbol): T {
  if (typeof value === 'symbol') {
    clack.cancel('Questionnaire interrompu.');
    throw new PrepworkError('CANCELLED', 'questionnaire interrompu');
  }
  return value;
}

/** Retire les clés `undefined` : clack refuse les propriétés optionnelles explicitement indéfinies. */
function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

// Les types d'options de clack ne sont pas exportés : on les récupère par instanciation.
type ClackTextOptions = Parameters<typeof clack.text>[0];
type ClackSelectOptions<T> = Parameters<typeof clack.select<T>>[0];

function toClackText(prompt: TextPrompt): ClackTextOptions {
  const validate = prompt.validate;
  // Frontière avec la bibliothèque : l'objet est construit sans clé indéfinie, puis typé.
  return compact({
    message: prompt.message,
    placeholder: prompt.placeholder,
    initialValue: prompt.initialValue,
    validate: validate ? (value: string | undefined) => validate(value ?? '') : undefined,
  }) as unknown as ClackTextOptions;
}

function toClackSelect<T extends string | number | boolean>(
  prompt: SelectPrompt<T>,
): ClackSelectOptions<T> {
  return compact({
    message: prompt.message,
    options: prompt.options.map((o) => compact({ value: o.value, label: o.label, hint: o.hint })),
    initialValue: prompt.initialValue,
  }) as unknown as ClackSelectOptions<T>;
}

export function createClackPrompter(): Prompter {
  return {
    intro(title) {
      clack.intro(title);
    },
    note(message, title) {
      clack.note(message, title);
    },
    async text(prompt) {
      return unwrap(await clack.text(toClackText(prompt)));
    },
    async select(prompt) {
      return unwrap(await clack.select(toClackSelect(prompt)));
    },
    async confirm(prompt) {
      const value = await clack.confirm({
        message: prompt.message,
        initialValue: prompt.initialValue ?? true,
      });
      return unwrap(value);
    },
    outro(message) {
      clack.outro(message);
    },
  };
}
