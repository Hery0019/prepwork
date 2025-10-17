import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DirEntry, FileSystem } from './types.js';

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

/** Implémentation Node du système de fichiers. Les fichiers sont toujours écrits en LF. */
export function createNodeFileSystem(): FileSystem {
  return {
    async readText(path) {
      try {
        return await readFile(path, 'utf8');
      } catch (error) {
        if (isNotFound(error)) return undefined;
        throw error;
      }
    },
    async writeText(path, content) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content, 'utf8');
    },
    async exists(path) {
      try {
        await stat(path);
        return true;
      } catch (error) {
        if (isNotFound(error)) return false;
        throw error;
      }
    },
    async list(dir) {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        const result: DirEntry[] = entries
          .filter((e) => e.isFile() || e.isDirectory())
          .map((e) => ({ name: e.name, kind: e.isDirectory() ? 'directory' : 'file' }));
        return result.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        if (isNotFound(error)) return [];
        throw error;
      }
    },
  };
}
