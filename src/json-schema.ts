// Génération des JSON Schema (autocomplétion IDE) depuis les schémas Zod.
// Jamais écrits à la main : `pnpm schemas` régénère `schema/*.schema.json` et un test
// vérifie que les fichiers commités sont à jour.
import { z, type ZodType } from 'zod';
import { CoreRuleSetSchema, FilesSchema, OptionSchema, ProfileSchema } from './catalog/schema.js';
import { ScaffoldSchema } from './config/schema.js';

export const JSON_SCHEMAS: Readonly<Record<string, { schema: ZodType; title: string }>> = {
  scaffold: { schema: ScaffoldSchema, title: 'prepwork scaffold.yaml' },
  profile: { schema: ProfileSchema, title: 'prepwork profile.yaml' },
  option: { schema: OptionSchema, title: 'prepwork option.yaml' },
  core: { schema: CoreRuleSetSchema, title: 'prepwork core rule set' },
  files: { schema: FilesSchema, title: 'prepwork files.yaml' },
};

/** Nom du schéma → texte JSON (indenté, terminé par un retour à la ligne). */
export function generateJsonSchemas(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, { schema, title }] of Object.entries(JSON_SCHEMAS)) {
    const json = z.toJSONSchema(schema, {
      target: 'draft-07',
      io: 'input',
      unrepresentable: 'any',
    });
    result[name] = `${JSON.stringify({ title, ...json }, null, 2)}\n`;
  }
  return result;
}
