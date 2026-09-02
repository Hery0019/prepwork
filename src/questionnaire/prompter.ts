// Interface d'interaction du questionnaire. La CLI branche @clack/prompts ; les tests
// branchent un prompteur scripté. Le questionnaire lui-même ne connaît aucune bibliothèque.

export interface SelectOption<T> {
  value: T;
  label: string;
  hint?: string | undefined;
}

export interface TextPrompt {
  message: string;
  placeholder?: string | undefined;
  initialValue?: string | undefined;
  /** Retourne un message d'erreur pour refuser la valeur, `undefined` pour l'accepter. */
  validate?: ((value: string) => string | undefined) | undefined;
}

export interface SelectPrompt<T> {
  message: string;
  options: SelectOption<T>[];
  initialValue?: T | undefined;
}

export interface ConfirmPrompt {
  message: string;
  initialValue?: boolean | undefined;
}

export interface Prompter {
  intro(title: string): void;
  note(message: string, title?: string): void;
  text(prompt: TextPrompt): Promise<string>;
  select<T extends string | number | boolean>(prompt: SelectPrompt<T>): Promise<T>;
  confirm(prompt: ConfirmPrompt): Promise<boolean>;
  outro(message: string): void;
}
