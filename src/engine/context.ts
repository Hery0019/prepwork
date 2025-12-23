// Contexte passé aux templates (`it`). Le cœur en construit la partie commune à toutes les
// stacks ; le pack la complète avec ses propres clés (`stack`, `maven`, `versions`, aides de
// typage…) via `pack.buildContext`. Les templates d'un profil n'accèdent jamais à `it.options`
// ni ceux d'une option à `it.profile` (vérifié par `check:content`).
import { stringify } from 'yaml';
import type { EnvVar, LocalizedText, PropertyTree } from '../catalog/schema.js';
import type { Language } from '../config/schema.js';

export interface ProfileInfo {
  id: string;
  version: string;
  summary: string;
  whenToUse: string[];
  whenNotToUse: string[];
}

/** Valeurs saisies au questionnaire mais absentes de `scaffold.yaml` (ne servent qu'à `init`). */
export interface ComposeExtras {
  /** Valeurs d'exemple à substituer dans `.env.example`, par nom de variable. */
  envOverrides?: Record<string, string> | undefined;
}

/** La part du contexte que le cœur garantit, quelle que soit la stack. */
export interface BaseTemplateContext {
  project: {
    name: string;
    description: string;
    /** Préfixe des classes ou composants racines : `pay-flow` → `PayFlow`. */
    className: string;
  };
  profile: string;
  profileInfo: ProfileInfo;
  optionIds: string[];
  git: { author: { name: string; email: string }; agentTrailer: boolean };
  language: { comments: Language; docs: Language };
  env: EnvVar[];
  toolVersion: string;
  /** Date du jour (AAAA-MM-JJ), injectable pour des rendus déterministes. */
  today: string;
  extras: ComposeExtras;
  /** Texte dans la langue des commentaires. */
  t: (fr: string, en: string) => string;
  /** Texte dans la langue de la documentation. */
  d: (fr: string, en: string) => string;
  /** Texte localisé du catalogue, dans la langue de la documentation. */
  text: (value: LocalizedText) => string;
  /** Sérialise un objet en YAML (sans document marker, sans retour final). */
  yaml: (value: unknown) => string;
  /** Fusion profonde additive (conflit sur une feuille différente). */
  merge: (base: PropertyTree, contribution: PropertyTree) => PropertyTree;
}

/** Contexte complet : la base commune plus les clés apportées par le pack. */
export type TemplateContext = BaseTemplateContext & Record<string, unknown>;

export function toClassName(kebab: string): string {
  return kebab
    .split('-')
    .filter((s) => s.length > 0)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

export function yamlText(value: unknown): string {
  return stringify(value, { lineWidth: 0 }).replace(/\n$/, '');
}
