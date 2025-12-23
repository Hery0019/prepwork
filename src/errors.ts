// Erreurs typées de prepwork. Jamais de `throw "string"` : chaque erreur porte un code
// stable, exploitable par la CLI pour choisir un message et un code de sortie.

export type ErrorCode =
  | 'CATALOG_INVALID'
  | 'CATALOG_NOT_FOUND'
  | 'SCAFFOLD_INVALID'
  | 'SCAFFOLD_NOT_FOUND'
  | 'COMPOSITION_CONFLICT'
  | 'TEMPLATE_ERROR'
  | 'PLAN_CONFLICT'
  | 'MANIFEST_INVALID'
  | 'TARGET_NOT_EMPTY'
  | 'UNKNOWN_STACK'
  | 'CANCELLED';

export class PrepworkError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'PrepworkError';
    this.code = code;
  }
}

/** Un problème détecté lors d'une validation : bloquant (`error`) ou informatif (`warning`). */
export interface Diagnostic {
  level: 'error' | 'warning';
  /** Fichier ou entité concernée, relative à la racine du contenu. */
  source: string;
  message: string;
}

export function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some((d) => d.level === 'error');
}

export function formatDiagnostic(diagnostic: Diagnostic): string {
  const tag = diagnostic.level === 'error' ? 'ERREUR' : 'AVERT.';
  return `${tag}  ${diagnostic.source} : ${diagnostic.message}`;
}
