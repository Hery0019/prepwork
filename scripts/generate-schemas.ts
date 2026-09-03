// Régénère schema/<pack>/*.schema.json depuis les schémas Zod. Usage : pnpm schemas
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { generateJsonSchemas } from '../src/json-schema.js';

const outDir = join(import.meta.dirname, '..', 'schema');
for (const [name, text] of Object.entries(generateJsonSchemas())) {
  const file = join(outDir, `${name}.schema.json`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text, 'utf8');
  console.log(`écrit ${file}`);
}
