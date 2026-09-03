import { describe, expect, it } from 'vitest';
import { sortJavaImports } from '../../src/packs/spring-boot/java-format.js';

describe('sortJavaImports', () => {
  it('orders static imports first, then regular imports in ASCII order, deduplicated', () => {
    const source = [
      'package mg.solumada.payflow.web;',
      '',
      'import mg.solumada.payflow.domain.Note;',
      'import static org.mockito.Mockito.when;',
      'import java.net.URI;',
      'import static org.assertj.core.api.Assertions.assertThat;',
      'import jakarta.validation.Valid;',
      'import java.net.URI;',
      '',
      'public class X {}',
      '',
    ].join('\n');
    expect(sortJavaImports(source)).toBe(
      [
        'package mg.solumada.payflow.web;',
        '',
        'import static org.assertj.core.api.Assertions.assertThat;',
        'import static org.mockito.Mockito.when;',
        '',
        'import jakarta.validation.Valid;',
        'import java.net.URI;',
        'import mg.solumada.payflow.domain.Note;',
        '',
        'public class X {}',
        '',
      ].join('\n'),
    );
  });

  it('leaves files without imports untouched', () => {
    const source = 'package a;\n\npublic class X {}\n';
    expect(sortJavaImports(source)).toBe(source);
  });

  it('puts a base package starting with com before jakarta, as palantir does', () => {
    const source =
      'package com.acme;\n\nimport jakarta.validation.Valid;\nimport com.acme.common.PageResponse;\n\nclass X {}\n';
    expect(sortJavaImports(source)).toBe(
      'package com.acme;\n\nimport com.acme.common.PageResponse;\nimport jakarta.validation.Valid;\n\nclass X {}\n',
    );
  });
});
