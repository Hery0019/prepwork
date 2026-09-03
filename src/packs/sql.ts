// Description d'une table de l'exemple de référence, partagée par les packs dont la stack a une
// base relationnelle (`spring-boot`, `aspnet`).
//
// Ce module appartient aux packs, jamais au cœur : le moteur ne connaît pas les tables SQL, et un
// pack sans base de données (`react`) ne l'importe pas. Seule la *description* est commune ; la
// traduction en type SQL, en type Java ou en type C# reste propre à chaque pack.
import { z } from 'zod';

export const ColumnTypeSchema = z.enum([
  'identity',
  'string',
  'text',
  'integer',
  'bigint',
  'boolean',
  'timestamp',
  'date',
  'decimal',
]);
export type ColumnType = z.infer<typeof ColumnTypeSchema>;

export const ColumnSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-z0-9_]*$/),
    type: ColumnTypeSchema,
    length: z.number().int().positive().optional(),
    nullable: z.boolean().default(false),
  })
  .strict()
  .refine((c) => c.length === undefined || c.type === 'string', {
    message: "`length` ne s'applique qu'au type `string`",
  });
export type Column = z.infer<typeof ColumnSchema>;

export const TableSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-z0-9_]*$/),
    columns: z.array(ColumnSchema).min(1),
  })
  .strict()
  .refine((t) => t.columns.filter((c) => c.type === 'identity').length === 1, {
    message: 'chaque table a exactement une colonne `identity`',
  });
export type Table = z.infer<typeof TableSchema>;

/** Tables déclarées par l'exemple de référence d'un profil. */
export function tablesOf(referenceExample: Record<string, unknown>): Table[] {
  return (referenceExample.tables as Table[] | undefined) ?? [];
}
