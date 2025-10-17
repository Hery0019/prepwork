// Régénère schema/*.schema.json depuis les schémas Zod. Usage : pnpm schemas
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateJsonSchemas } from '../src/json-schema.js';

const outDir = join(import.meta.dirname, '..', 'schema');
await mkdir(outDir, { recursive: true });
for (const [name, text] of Object.entries(generateJsonSchemas())) {
  const file = join(outDir, `${name}.schema.json`);
  await writeFile(file, text, 'utf8');
  console.log(`écrit ${file}`);
}
