import { PrepworkError } from '../errors.js';
import { claudeCodeRenderer } from './claude-code/index.js';
import type { Renderer } from './types.js';

export type { RenderedFile, RenderInput, Renderer } from './types.js';
export { claudeCodeRenderer };

const RENDERERS: readonly Renderer[] = [claudeCodeRenderer];

export function getRenderer(id: string): Renderer {
  const renderer = RENDERERS.find((r) => r.id === id);
  if (!renderer) {
    throw new PrepworkError(
      'CATALOG_INVALID',
      `renderer inconnu \`${id}\` (disponibles : ${RENDERERS.map((r) => r.id).join(', ')})`,
    );
  }
  return renderer;
}
