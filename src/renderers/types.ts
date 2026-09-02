// Contrat d'un renderer : une définition YAML (core + profil + options) et un scaffold
// deviennent des fichiers de spécification pour une cible d'agent (claude-code en v1).
// Un renderer ne connaît ni la CLI ni le questionnaire.
import type { CoreRuleSet, Option, Profile } from '../catalog/schema.js';
import type { Scaffold } from '../config/schema.js';

export interface RenderedFile {
  /** Chemin relatif à la racine du projet généré, en `/`. */
  path: string;
  content: string;
}

export interface RenderInput {
  scaffold: Scaffold;
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
