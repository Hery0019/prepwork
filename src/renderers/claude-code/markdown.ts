// Petits utilitaires Markdown : tableaux, listes, sections. Sortie déterministe, LF, fin de
// fichier par un unique retour à la ligne.

export function table(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const escape = (cell: string): string => cell.replace(/\|/g, '\\|');
  const line = (cells: readonly string[]): string => `| ${cells.map(escape).join(' | ')} |`;
  return [line(headers), `|${headers.map(() => '---').join('|')}|`, ...rows.map(line)].join('\n');
}

export function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

export function numbered(items: readonly string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

/** Assemble des blocs séparés par une ligne vide, en ignorant les blocs vides. */
export function blocks(...parts: readonly (string | undefined | false)[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join('\n\n');
}

export function document(...parts: readonly (string | undefined | false)[]): string {
  return `${blocks(...parts)}\n`;
}

export function frontmatter(fields: Record<string, string>): string {
  const lines = Object.entries(fields).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return ['---', ...lines, '---'].join('\n');
}
