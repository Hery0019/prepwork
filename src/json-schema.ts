// Génération des JSON Schema (autocomplétion IDE) depuis les schémas Zod, pack par pack.
// Jamais écrits à la main : `pnpm schemas` régénère `schema/<pack>/*.schema.json` et un test
// vérifie que les fichiers commités sont à jour.
import { z } from 'zod';
import { PACKS } from './packs/index.js';

/** Chemin relatif dans `schema/` → texte JSON (indenté, terminé par un retour à la ligne). */
export function generateJsonSchemas(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pack of PACKS) {
    for (const [name, { schema, title }] of Object.entries(pack.jsonSchemas())) {
      const json = z.toJSONSchema(schema, {
        target: 'draft-07',
        io: 'input',
        unrepresentable: 'any',
      });
      result[`${pack.id}/${name}`] = `${JSON.stringify({ title, ...json }, null, 2)}
`;
    }
  }
  return result;
}
