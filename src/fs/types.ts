// Abstraction minimale du système de fichiers. Tout module qui lit ou écrit passe par
// cette interface, ce qui rend le catalogue, le moteur et la CLI testables sans I/O réel.

export interface DirEntry {
  name: string;
  kind: 'file' | 'directory';
}

export interface FileSystem {
  /** Contenu texte (UTF-8) ou `undefined` si le fichier n'existe pas. */
  readText(path: string): Promise<string | undefined>;
  /** Écrit le fichier en créant les répertoires parents. */
  writeText(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  /** Entrées directes d'un répertoire, triées par nom ; `[]` si le répertoire n'existe pas. */
  list(dir: string): Promise<DirEntry[]>;
  /** Supprime un fichier ; silencieux s'il n'existe pas. */
  remove(path: string): Promise<void>;
}

const SEPARATORS = /[\\/]+/;

/** Jointure de chemins indépendante de la plateforme : les chemins internes utilisent `/`. */
export function joinPath(...segments: string[]): string {
  const parts: string[] = [];
  for (const segment of segments) {
    if (segment === '') continue;
    for (const piece of segment.split(SEPARATORS)) {
      if (piece === '' || piece === '.') continue;
      if (piece === '..') {
        if (parts.length > 0 && parts[parts.length - 1] !== '..') parts.pop();
        else parts.push(piece);
        continue;
      }
      parts.push(piece);
    }
  }
  const joined = parts.join('/');
  const first = segments.find((s) => s !== '');
  const absolute = first !== undefined && SEPARATORS.test(first.charAt(0));
  return absolute ? `/${joined}` : joined;
}

/** Normalise les séparateurs Windows en `/`, sans autre transformation. */
export function toPosix(path: string): string {
  return path.split('\\').join('/');
}
