// Post-traitement des sources C# générées : tri des directives `using` dans l'ordre qu'exige
// `dotnet format` avec `dotnet_sort_system_directives_first = true` — `System` d'abord, puis les
// autres, puis les `using static`, puis les alias. L'ordre dépend de l'espace de noms racine
// choisi par l'équipe, donc aucun template ne peut le figer.

const USING_LINE = /^using\s+(static\s+)?([\w.<>,\s]+?)(\s*=\s*[\w.<>,\s]+?)?\s*;\s*$/;

interface Directive {
  text: string;
  /** 0 `System*`, 1 autres, 2 `using static`, 3 alias. */
  rank: number;
  key: string;
}

function classify(line: string): Directive | undefined {
  const match = USING_LINE.exec(line);
  if (!match) return undefined;
  const isStatic = match[1] !== undefined;
  const isAlias = match[3] !== undefined;
  const name = (match[2] ?? '').trim();
  const rank = isAlias ? 3 : isStatic ? 2 : name === 'System' || name.startsWith('System.') ? 0 : 1;
  return { text: line.trim(), rank, key: name };
}

/** Trie le bloc de `using` d'un fichier C# ; laisse tout le reste intact. */
export function sortUsings(source: string): string {
  const lines = source.split('\n');
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (classify(line) !== undefined) {
      if (start === -1) start = i;
      end = i;
    } else if (start !== -1 && line.trim() !== '') {
      break;
    }
  }
  if (start === -1) return source;

  const seen = new Map<string, Directive>();
  for (const line of lines.slice(start, end + 1)) {
    const directive = classify(line);
    if (directive) seen.set(directive.text, directive);
  }
  const sorted = [...seen.values()].sort((a, b) =>
    a.rank !== b.rank ? a.rank - b.rank : a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
  );

  return [...lines.slice(0, start), ...sorted.map((d) => d.text), ...lines.slice(end + 1)].join(
    '\n',
  );
}
