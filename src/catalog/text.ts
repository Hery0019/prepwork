import type { Language, LocalizedText } from './schema.js';

/** Résout un texte localisé dans la langue demandée ; une chaîne nue est en anglais. */
export function pickText(text: LocalizedText, language: Language): string {
  if (typeof text === 'string') return text;
  return text[language];
}

/** Toutes les variantes d'un texte localisé (utile aux vérifications de contenu). */
export function allVariants(text: LocalizedText): string[] {
  if (typeof text === 'string') return [text];
  return [text.en, text.fr];
}
