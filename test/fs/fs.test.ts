import { describe, expect, it } from 'vitest';
import { createMemoryFileSystem } from '../../src/fs/memory.js';
import { joinPath, toPosix } from '../../src/fs/types.js';
import { walkFiles } from '../../src/fs/walk.js';

describe('joinPath', () => {
  it('joins segments with forward slashes and normalises separators', () => {
    expect(joinPath('a', 'b/c', 'd')).toBe('a/b/c/d');
    expect(joinPath('a\\b', 'c')).toBe('a/b/c');
  });

  it('keeps Windows drive letters and POSIX absolute roots', () => {
    expect(joinPath('D:/work', 'x')).toBe('D:/work/x');
    expect(joinPath('/tmp', 'x')).toBe('/tmp/x');
  });

  it('resolves . and .. segments', () => {
    expect(joinPath('a/./b', '../c')).toBe('a/c');
    expect(joinPath('', 'a')).toBe('a');
  });

  it('toPosix only replaces separators', () => {
    expect(toPosix('a\\b\\c')).toBe('a/b/c');
  });
});

describe('memory file system', () => {
  it('reads, writes and lists files', async () => {
    const fs = createMemoryFileSystem({ 'root/a.txt': 'A', 'root/sub/b.txt': 'B' });
    expect(await fs.readText('root/a.txt')).toBe('A');
    expect(await fs.readText('root/missing.txt')).toBeUndefined();
    await fs.writeText('root/sub/c.txt', 'C');
    expect(await fs.list('root')).toEqual([
      { name: 'a.txt', kind: 'file' },
      { name: 'sub', kind: 'directory' },
    ]);
    expect(await fs.list('root/sub')).toEqual([
      { name: 'b.txt', kind: 'file' },
      { name: 'c.txt', kind: 'file' },
    ]);
    expect(await fs.list('nowhere')).toEqual([]);
  });

  it('exists is true for files and for directories implied by files', async () => {
    const fs = createMemoryFileSystem({ 'root/sub/b.txt': 'B' });
    expect(await fs.exists('root/sub')).toBe(true);
    expect(await fs.exists('root/sub/b.txt')).toBe(true);
    expect(await fs.exists('root/other')).toBe(false);
  });

  it('walkFiles lists relative paths recursively, sorted', async () => {
    const fs = createMemoryFileSystem({
      'root/z.txt': '',
      'root/a/b.txt': '',
      'root/a/c/d.txt': '',
    });
    expect(await walkFiles(fs, 'root')).toEqual(['a/b.txt', 'a/c/d.txt', 'z.txt']);
    expect(await walkFiles(fs, 'missing')).toEqual([]);
  });
});
