import type { DirEntry, FileSystem } from './types.js';
import { toPosix } from './types.js';

export interface MemoryFileSystem extends FileSystem {
  /** Instantané trié des fichiers (chemin → contenu), pratique pour les assertions. */
  snapshot(): Record<string, string>;
}

/** Système de fichiers en mémoire pour les tests. Les chemins sont normalisés en `/`. */
export function createMemoryFileSystem(initial: Record<string, string> = {}): MemoryFileSystem {
  const files = new Map<string, string>();
  for (const [path, content] of Object.entries(initial)) files.set(normalize(path), content);

  function normalize(path: string): string {
    return toPosix(path).replace(/\/+$/, '');
  }

  return {
    readText(path) {
      return Promise.resolve(files.get(normalize(path)));
    },
    writeText(path, content) {
      files.set(normalize(path), content);
      return Promise.resolve();
    },
    exists(path) {
      const key = normalize(path);
      if (files.has(key)) return Promise.resolve(true);
      const prefix = `${key}/`;
      return Promise.resolve([...files.keys()].some((k) => k.startsWith(prefix)));
    },
    remove(path) {
      files.delete(normalize(path));
      return Promise.resolve();
    },
    list(dir) {
      const prefix = normalize(dir) === '' ? '' : `${normalize(dir)}/`;
      const seen = new Map<string, DirEntry>();
      for (const key of files.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        const slash = rest.indexOf('/');
        const name = slash === -1 ? rest : rest.slice(0, slash);
        if (name === '') continue;
        seen.set(name, { name, kind: slash === -1 ? 'file' : 'directory' });
      }
      return Promise.resolve([...seen.values()].sort((a, b) => a.name.localeCompare(b.name)));
    },
    snapshot() {
      return Object.fromEntries([...files.entries()].sort(([a], [b]) => a.localeCompare(b)));
    },
  };
}
