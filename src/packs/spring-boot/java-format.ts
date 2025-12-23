// Post-traitement des sources Java générées : tri des imports dans l'ordre attendu par
// palantir-java-format (imports statiques d'abord, puis les autres, ordre ASCII). L'ordre
// dépend du package de base choisi par l'équipe, donc aucun template ne peut le figer.

const IMPORT_LINE = /^import\s+(static\s+)?([\w.$*]+)\s*;\s*$/;

/** Trie le bloc d'imports d'un fichier Java ; laisse tout le reste intact. */
export function sortJavaImports(source: string): string {
  const lines = source.split('\n');
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (IMPORT_LINE.test(line)) {
      if (start === -1) start = i;
      end = i;
    } else if (start !== -1 && line.trim() !== '') {
      break;
    }
  }
  if (start === -1) return source;

  const statics = new Set<string>();
  const regulars = new Set<string>();
  for (const line of lines.slice(start, end + 1)) {
    const match = IMPORT_LINE.exec(line);
    if (!match) continue;
    (match[1] ? statics : regulars).add(match[2] ?? '');
  }
  const byAscii = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
  const block: string[] = [];
  if (statics.size > 0)
    block.push(...[...statics].sort(byAscii).map((name) => `import static ${name};`));
  if (statics.size > 0 && regulars.size > 0) block.push('');
  if (regulars.size > 0)
    block.push(...[...regulars].sort(byAscii).map((name) => `import ${name};`));

  return [...lines.slice(0, start), ...block, ...lines.slice(end + 1)].join('\n');
}
