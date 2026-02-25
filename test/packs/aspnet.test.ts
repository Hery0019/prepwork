// Ce que le pack `aspnet` apporte au cœur : résolution du graphe de projets, chemins relatifs,
// répartition des paquets par rôle, et tri des `using` attendu par `dotnet format`.
import { describe, expect, it } from 'vitest';
import { PrepworkError } from '../../src/errors.js';
import type { DotnetContribution } from '../../src/packs/aspnet/catalog.js';
import { relativePath, resolveProjects } from '../../src/packs/aspnet/context.js';
import { sortUsings } from '../../src/packs/aspnet/csharp-format.js';
import { defaultRootNamespace, rootNamespaceProblem } from '../../src/packs/aspnet/scaffold.js';

const PROFILE: DotnetContribution = {
  projects: [
    { id: 'domain', suffix: 'Domain', kind: 'library', references: [], roles: ['kernel'] },
    { id: 'api', suffix: 'Api', kind: 'web', references: ['domain'], roles: ['host'] },
    { id: 'tests', suffix: 'Tests', kind: 'test', references: ['api'], roles: ['tests'] },
  ],
  packages: [],
  properties: {},
};

function contributions(
  ...extra: [string, DotnetContribution][]
): [string, DotnetContribution | undefined][] {
  return [['profiles/layered', PROFILE], ...extra];
}

describe('relative project paths', () => {
  it('walks up out of tests/ before entering src/', () => {
    expect(relativePath('tests/App.Tests', 'src/App.Api/App.Api.csproj')).toBe(
      '../../src/App.Api/App.Api.csproj',
    );
  });

  it('stays inside src/ between two sibling projects', () => {
    expect(relativePath('src/App.Api', 'src/App.Domain/App.Domain.csproj')).toBe(
      '../App.Domain/App.Domain.csproj',
    );
  });
});

describe('project graph', () => {
  it('places tests under tests/ and everything else under src/', () => {
    const projects = resolveProjects('App', contributions(), {});

    expect(projects.map((p) => p.dir)).toEqual([
      'src/App.Domain',
      'src/App.Api',
      'tests/App.Tests',
    ]);
  });

  it('gives an option package to every project holding the targeted role', () => {
    const option: DotnetContribution = {
      projects: [],
      properties: {},
      packages: [
        {
          id: 'Some.Package',
          version: '1.0.0',
          role: 'host',
          private_assets: false,
          purpose: 'x',
        },
      ],
    };

    const projects = resolveProjects('App', contributions(['options/x', option]), {});

    expect(projects.find((p) => p.id === 'api')?.packages.map((n) => n.id)).toEqual([
      'Some.Package',
    ]);
    expect(projects.find((p) => p.id === 'domain')?.packages).toEqual([]);
  });

  it('refuses a role that no project holds, instead of dropping the package silently', () => {
    const option: DotnetContribution = {
      projects: [],
      properties: {},
      packages: [
        {
          id: 'Some.Package',
          version: '1.0.0',
          role: 'persistence',
          private_assets: false,
          purpose: 'x',
        },
      ],
    };

    const error = (() => {
      try {
        resolveProjects('App', contributions(['options/x', option]), {});
        return undefined;
      } catch (cause: unknown) {
        return cause;
      }
    })();

    expect(error).toBeInstanceOf(PrepworkError);
    expect((error as PrepworkError).message).toContain('persistence');
  });

  it('reports two options disagreeing on a package version', () => {
    const one: DotnetContribution = {
      projects: [],
      properties: {},
      packages: [
        { id: 'Shared', version: '1.0.0', role: 'host', private_assets: false, purpose: 'x' },
      ],
    };
    const two: DotnetContribution = {
      projects: [],
      properties: {},
      packages: [
        { id: 'Shared', version: '2.0.0', role: 'host', private_assets: false, purpose: 'y' },
      ],
    };

    expect(() =>
      resolveProjects('App', contributions(['options/one', one], ['options/two', two]), {}),
    ).toThrow(/Shared/);
  });
});

describe('using directives', () => {
  it('puts System first, then the rest in alphabetical order', () => {
    const source = [
      'using Microsoft.EntityFrameworkCore;',
      'using System.Text.Json;',
      'using App.Domain.Notes;',
      'using System;',
      '',
      'namespace App.Api;',
    ].join('\n');

    expect(sortUsings(source).split('\n').slice(0, 4)).toEqual([
      'using System;',
      'using System.Text.Json;',
      'using App.Domain.Notes;',
      'using Microsoft.EntityFrameworkCore;',
    ]);
  });

  it('leaves a file without using directives untouched', () => {
    const source = 'namespace App.Api;\n\npublic sealed class Thing;\n';
    expect(sortUsings(source)).toBe(source);
  });
});

describe('root namespace', () => {
  it('derives a PascalCase namespace from a kebab-case project name', () => {
    expect(defaultRootNamespace('pay-flow')).toBe('PayFlow');
  });

  it('accepts a single segment, unlike a Java package', () => {
    expect(rootNamespaceProblem('PayFlow')).toBeUndefined();
    expect(rootNamespaceProblem('Solumada.PayFlow')).toBeUndefined();
  });

  it('refuses lower-case segments', () => {
    expect(rootNamespaceProblem('solumada.payflow')).toContain('PascalCase');
  });
});
