import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateJsonSchemas } from '../src/json-schema.js';

const schemaDir = join(import.meta.dirname, '..', 'schema');

describe('generated JSON schemas', () => {
  it('are committed and up to date (run `pnpm schemas` otherwise)', async () => {
    for (const [name, expected] of Object.entries(generateJsonSchemas())) {
      const committed = await readFile(join(schemaDir, `${name}.schema.json`), 'utf8');
      expect(committed, `schema/${name}.schema.json`).toBe(expected);
    }
  });

  it('describe the scaffold enums for IDE completion', () => {
    const scaffold = JSON.parse(generateJsonSchemas()['spring-boot/scaffold'] ?? '{}') as {
      properties: {
        profile: { enum: string[] };
        stack: { properties: { database: { enum: string[] } } };
      };
    };
    expect(scaffold.properties.profile.enum).toEqual(['layered', 'modular']);
    expect(scaffold.properties.stack.properties.database.enum).toEqual([
      'postgresql',
      'mysql',
      'oracle',
      'none',
    ]);
  });
});
