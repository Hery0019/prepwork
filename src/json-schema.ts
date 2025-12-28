// Génération des JSON Schema (autocomplétion IDE) depuis les schémas Zod, pack par pack, plus
// un schéma `common` permissif pour les ensembles de règles partagés par tous les packs.
// Jamais écrits à la main : `pnpm schemas` régénère `schema/<pack>/*.schema.json` et un test
// vérifie que les fichiers commités sont à jour.
import { z, type ZodType } from 'zod';
import { createCatalogSchemas } from './catalog/schema.js';
import { PACKS } from './packs/index.js';

function toJson(schema: ZodType, title: string): string {
  const json = z.toJSONSchema(schema, { target: 'draft-07', io: 'input', unrepresentable: 'any' });
  return `${JSON.stringify({ title, ...json }, null, 2)}\n`;
}

/**
 * Schéma des ensembles de règles de `content/common`, valable pour tous les packs : il accepte
 * l'union de leurs valeurs de `enforced_by` et de leurs noms de skills.
 */
function commonCoreSchema(): string {
  const enforcedBy = new Set<string>();
  const skills = new Set<string>();
  for (const pack of PACKS) {
    for (const value of pack.catalogSpecValues.enforcedBy) enforcedBy.add(value);
    for (const value of pack.catalogSpecValues.skills) skills.add(value);
  }
  const schemas = createCatalogSchemas({
    enforcedBy: [...enforcedBy] as [string, ...string[]],
    skills: [...skills] as [string, ...string[]],
    layerTarget: z.string(),
  });
  return toJson(schemas.CoreRuleSetSchema, 'prepwork core rule set (common)');
}

/** Chemin relatif dans `schema/` → texte JSON (indenté, terminé par un retour à la ligne). */
export function generateJsonSchemas(): Record<string, string> {
  const result: Record<string, string> = { 'common/core': commonCoreSchema() };
  for (const pack of PACKS) {
    for (const [name, { schema, title }] of Object.entries(pack.jsonSchemas())) {
      result[`${pack.id}/${name}`] = toJson(schema, title);
    }
  }
  return result;
}
