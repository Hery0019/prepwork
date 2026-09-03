// Contrat d'un renderer : une définition YAML (core + profil + options) et un scaffold
// deviennent des fichiers de spécification pour une cible d'agent (claude-code en v1).
// Un renderer ne connaît ni la CLI ni le questionnaire.
import type { CoreRuleSet, Option, Profile } from '../catalog/schema.js';
import type { BaseScaffold } from '../config/schema.js';
import type { StackPack } from '../packs/types.js';

export interface RenderedFile {
  /** Chemin relatif à la racine du projet généré, en `/`. */
  path: string;
  content: string;
}

export interface RenderInput {
  scaffold: BaseScaffold;
  /** Pack de la stack : skills, libellés et sections qui nomment la technologie. */
  pack: StackPack;
  core: readonly CoreRuleSet[];
  profile: Profile;
  /** Options résolues depuis le scaffold, dans l'ordre de `resolveOptionIds`. */
  options: readonly Option[];
  /** Version de prepwork, affichée dans l'en-tête des fichiers générés. */
  toolVersion: string;
}

export interface Renderer {
  readonly id: string;
  render(input: RenderInput): RenderedFile[];
}
