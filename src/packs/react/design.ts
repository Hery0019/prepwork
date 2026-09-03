// Contrat visuel du pack `react` (ADR 0007 §6). Un preset fixe la typographie, l'échelle
// modulaire, l'espacement, les rayons et la palette sémantique en clair et en sombre. Les
// valeurs vivent ici parce que le squelette (étape 10) écrit `tokens.css` depuis elles et que
// le skill `ui` les affiche : une seule source pour les deux.

export interface DesignPreset {
  id: string;
  /** Familles de police : titres, texte, mono. */
  fonts: { heading: string; body: string; mono: string };
  /** Ratio de l'échelle modulaire des tailles de texte. */
  scaleRatio: string;
  /** Interlignage du corps et des titres. */
  lineHeight: { body: string; heading: string };
  /** Graisses autorisées, dans l'ordre. */
  weights: number[];
  /** Longueur de ligne cible du corps de texte. */
  measure: string;
  /** Pas de base de l'échelle d'espacement, en pixels. */
  spacingBase: number;
  /** Rayon par défaut, en pixels. */
  radius: number;
  /** Palette sémantique en thème clair ; le thème sombre redéfinit les mêmes clés. */
  light: Record<string, string>;
  dark: Record<string, string>;
}

const SEMANTIC_KEYS = [
  'background',
  'surface',
  'text',
  'muted',
  'border',
  'primary',
  'primary-foreground',
  'destructive',
  'success',
] as const;

export type SemanticToken = (typeof SEMANTIC_KEYS)[number];
export const DESIGN_TOKEN_KEYS: readonly string[] = SEMANTIC_KEYS;

/** Applicatif sobre : le défaut, pensé pour une application métier dense mais lisible. */
const appSober: DesignPreset = {
  id: 'app-sober',
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  scaleRatio: '1.200',
  lineHeight: { body: '1.5', heading: '1.2' },
  weights: [400, 500, 600, 700],
  measure: '70ch',
  spacingBase: 4,
  radius: 8,
  light: {
    background: '#ffffff',
    surface: '#f6f7f9',
    text: '#101828',
    muted: '#5a6472',
    border: '#d6dae0',
    primary: '#3a5bd9',
    'primary-foreground': '#ffffff',
    destructive: '#b3261e',
    success: '#1c6b3f',
  },
  dark: {
    background: '#101319',
    surface: '#181c24',
    text: '#e8eaee',
    muted: '#a2abb8',
    border: '#2b323d',
    primary: '#8fa6f5',
    'primary-foreground': '#101319',
    destructive: '#f2a49e',
    success: '#7fd0a3',
  },
};

/** Éditorial : produit tourné contenu, titres en serif, plus d'air. */
const editorial: DesignPreset = {
  id: 'editorial',
  fonts: {
    heading: "'Newsreader', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  scaleRatio: '1.250',
  lineHeight: { body: '1.6', heading: '1.15' },
  weights: [400, 500, 600, 700],
  measure: '68ch',
  spacingBase: 4,
  radius: 6,
  light: {
    background: '#fdfcfa',
    surface: '#f3f0ea',
    text: '#1a1714',
    muted: '#6a625a',
    border: '#ddd6cc',
    primary: '#8a4b2a',
    'primary-foreground': '#fdfcfa',
    destructive: '#a32b22',
    success: '#3f6b3a',
  },
  dark: {
    background: '#16130f',
    surface: '#1f1b16',
    text: '#eee8e0',
    muted: '#b0a698',
    border: '#332d26',
    primary: '#e0a075',
    'primary-foreground': '#16130f',
    destructive: '#f0a9a2',
    success: '#9dcb96',
  },
};

/** Dense : back-office et tableaux, échelle courte et rayons discrets. */
const dense: DesignPreset = {
  id: 'dense',
  fonts: {
    heading: 'system-ui, sans-serif',
    body: 'system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  scaleRatio: '1.125',
  lineHeight: { body: '1.45', heading: '1.2' },
  weights: [400, 500, 600],
  measure: '80ch',
  spacingBase: 4,
  radius: 4,
  light: {
    background: '#ffffff',
    surface: '#f2f4f7',
    text: '#0f172a',
    muted: '#556070',
    border: '#cfd5dd',
    primary: '#1f5f9e',
    'primary-foreground': '#ffffff',
    destructive: '#a32019',
    success: '#186b45',
  },
  dark: {
    background: '#0d1117',
    surface: '#151b23',
    text: '#e6e9ee',
    muted: '#9aa4b2',
    border: '#262d37',
    primary: '#78b3e8',
    'primary-foreground': '#0d1117',
    destructive: '#f0a19a',
    success: '#79cfa4',
  },
};

export const DESIGN_PRESETS: Record<string, DesignPreset> = {
  'app-sober': appSober,
  editorial,
  dense,
};

export const DESIGN_PRESET_IDS = ['app-sober', 'editorial', 'dense'] as const;

export function designPreset(id: string): DesignPreset {
  return DESIGN_PRESETS[id] ?? appSober;
}
