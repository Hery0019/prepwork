import { fileURLToPath } from 'node:url';
import { toPosix } from '../fs/types.js';

/**
 * Répertoire `content/` livré avec l'outil. Fonctionne depuis `src/` (tsx) comme depuis
 * `dist/` (build), tous deux à deux niveaux sous la racine du paquet.
 */
export function defaultContentRoot(): string {
  return toPosix(fileURLToPath(new URL('../../content', import.meta.url)));
}
