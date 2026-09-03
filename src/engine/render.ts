// Rendu complet d'un projet : templates du catalogue + fichiers du renderer d'agent.
// Aucune écriture ici : le résultat alimente le plan (plan.ts). Le post-traitement des fichiers
// rendus (imports triés, fins de ligne) appartient au pack.
import type { Renderer } from '../renderers/types.js';
import type { Composition } from './compose.js';
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

export function renderProject(
  composition: Composition,
  renderer: Renderer,
  engine: TemplateEngine = createTemplateEngine(),
): GeneratedFile[] {
  const { pack } = composition;
  const files: GeneratedFile[] = composition.files.map((planned) => {
    const rendered = engine.render(
      planned.template,
      composition.context,
      `${planned.source}:${planned.entry.source}`,
    );
    return {
      path: planned.target,
      content: pack.postProcess(planned.target, rendered),
      owner: planned.owner,
      source: planned.source,
    };
  });

  const rendered = renderer.render({
    scaffold: composition.scaffold,
    pack,
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
