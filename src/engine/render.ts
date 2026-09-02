// Rendu complet d'un projet : templates du catalogue + fichiers du renderer d'agent.
// Aucune écriture ici : le résultat alimente le plan (plan.ts).
import type { Renderer } from '../renderers/types.js';
import type { Composition } from './compose.js';
import { sortJavaImports } from './java-format.js';
import { createTemplateEngine, type TemplateEngine } from './templates.js';

export interface GeneratedFile {
  /** Chemin relatif à la racine du projet, en `/`. */
  path: string;
  content: string;
  /** `generated` : suivi dans le manifeste ; `team` : créé une fois puis laissé à l'équipe. */
  owner: 'generated' | 'team';
  /** Origine, pour les rapports : `core`, `profiles/layered`, `options/docker`, `renderer:claude-code`. */
  source: string;
}

const CRLF_EXTENSIONS = ['.cmd', '.bat'];

/** Post-traitements par type de fichier : imports Java triés, scripts Windows en CRLF. */
function finalizeContent(path: string, rendered: string): string {
  if (path.endsWith('.java')) return sortJavaImports(rendered);
  if (CRLF_EXTENSIONS.some((ext) => path.endsWith(ext))) {
    return rendered.split('\r\n').join('\n').split('\n').join('\r\n');
  }
  return rendered;
}

export function renderProject(
  composition: Composition,
  renderer: Renderer,
  engine: TemplateEngine = createTemplateEngine(),
): GeneratedFile[] {
  const files: GeneratedFile[] = composition.files.map((planned) => {
    const rendered = engine.render(
      planned.template,
      composition.context,
      `${planned.source}:${planned.entry.source}`,
    );
    return {
      path: planned.target,
      content: finalizeContent(planned.target, rendered),
      owner: planned.owner,
      source: planned.source,
    };
  });

  const rendered = renderer.render({
    scaffold: composition.scaffold,
    core: composition.catalog.core.ruleSets,
    profile: composition.profile.profile,
    options: composition.options.map((o) => o.option),
    toolVersion: composition.context.toolVersion,
  });
  for (const file of rendered) {
    files.push({
      path: file.path,
      content: file.content,
      owner: 'generated',
      source: `renderer:${renderer.id}`,
    });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}
