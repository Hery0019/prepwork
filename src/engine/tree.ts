// Fusion additive d'arbres de configuration (YAML/JSON) : deux contributions peuvent compléter
// le même arbre, jamais redéfinir une feuille avec une autre valeur (CLAUDE.md §2).
import type { PropertyTree } from '../catalog/schema.js';
import { PrepworkError } from '../errors.js';

export function isPlainObject(value: unknown): value is PropertyTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function cloneTree(tree: PropertyTree): PropertyTree {
  return JSON.parse(JSON.stringify(tree)) as PropertyTree;
}

/**
 * Fusionne `source` dans `target`. `what` nomme l'arbre dans le message de conflit
 * (« propriété Spring », « script npm »…), `label` désigne la contribution fautive.
 */
export function mergeTree(
  target: PropertyTree,
  source: PropertyTree,
  path: string,
  label: string,
  what = 'propriété',
): void {
  for (const [key, value] of Object.entries(source)) {
    const fullPath = path === '' ? key : `${path}.${key}`;
    const existing = target[key];
    if (existing === undefined) {
      target[key] = isPlainObject(value) ? cloneTree(value) : value;
    } else if (isPlainObject(existing) && isPlainObject(value)) {
      mergeTree(existing, value, fullPath, label, what);
    } else if (JSON.stringify(existing) !== JSON.stringify(value)) {
      throw new PrepworkError(
        'COMPOSITION_CONFLICT',
        `${what} \`${fullPath}\` : déjà définie avec une autre valeur (contribution de ${label})`,
      );
    }
  }
}
