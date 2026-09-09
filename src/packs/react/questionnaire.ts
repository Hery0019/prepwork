// Le questionnaire du pack `react` (ADR 0007 §7) : ordre fixe, valeurs par défaut entre crochets,
// réponses validées, puis récapitulatif et confirmation. Une question dont la réponse est unique
// n'est pas posée : elle est annoncée.
import { PROJECT_NAME_PATTERN, SCAFFOLD_VERSION } from '../../config/schema.js';
import type { ComposeExtras } from '../../engine/context.js';
import { PrepworkError } from '../../errors.js';
import type { Prompter } from '../../questionnaire/prompter.js';
import type { QuestionnaireInput } from '../types.js';
import { designPreset, DESIGN_PRESET_IDS } from './design.js';
import {
  ScaffoldSchema,
  type Ci,
  type Data,
  type Forms,
  type Preset,
  type Scaffold,
  type Security,
  type State,
} from './scaffold.js';

/** Profils proposés au questionnaire. */
export type ProfileChoice = QuestionnaireInput['profiles'][number];

export interface ReactQuestionnaireResult {
  scaffold: Scaffold;
  extras: ComposeExtras;
}

function validateProjectName(value: string): string | undefined {
  return PROJECT_NAME_PATTERN.test(value)
    ? undefined
    : 'nom en kebab-case attendu (lettres minuscules, chiffres, tirets), ex. note-book';
}

function validateDescription(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'une description est requise';
  if (trimmed.length > 200) return '200 caractères au plus';
  return undefined;
}

function validateEmail(value: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'adresse e-mail invalide';
}

function validatePath(value: string): string | undefined {
  return value.startsWith('/') ? undefined : 'chemin absolu attendu, commençant par `/`';
}

function summary(scaffold: Scaffold): string {
  const preset = designPreset(scaffold.design.preset);
  return [
    `Projet         ${scaffold.project.name} — ${scaffold.project.description}`,
    `Profil         ${scaffold.profile}`,
    `Données        ${scaffold.stack.data}`,
    `Formulaires    ${scaffold.stack.forms}`,
    `État client    ${scaffold.options.state}`,
    `Auth           ${scaffold.options.security}`,
    `i18n           ${scaffold.options.i18n ? 'oui' : 'non'}`,
    `Tests e2e      ${scaffold.options.e2e ? 'Playwright' : 'non'}`,
    `Docker         ${scaffold.options.docker ? 'oui' : 'non'}`,
    `CI             ${scaffold.options.ci}`,
    `Visuel         ${preset.id} (${preset.fonts.body}, échelle ${preset.scaleRatio})${scaffold.design.dark ? ' + thème sombre' : ''}`,
    `Auteur git     ${scaffold.git.author.name} <${scaffold.git.author.email}>${scaffold.git.agent_trailer ? ' + trailer Co-Authored-By' : ''}`,
    `Langues        commentaires ${scaffold.language.comments}, docs ${scaffold.language.docs}`,
  ].join('\n');
}

const PRESET_HINT: Record<string, string> = {
  'app-sober': 'application métier, Inter, échelle 1,200',
  editorial: 'produit de contenu, titres serif, plus d’air',
  dense: 'back-office et tableaux, échelle courte',
};

export async function runQuestionnaire(
  prompter: Prompter,
  input: QuestionnaireInput,
): Promise<ReactQuestionnaireResult> {
  if (input.profiles.length === 0) {
    throw new PrepworkError('CATALOG_NOT_FOUND', 'aucun profil disponible dans le catalogue');
  }
  prompter.intro('prepwork — préparation du projet React');

  // 1-2. Identité du projet
  const name = await prompter.text({
    message: '1. Nom du projet (kebab-case)',
    placeholder: 'note-book',
    validate: validateProjectName,
  });
  const description = (
    await prompter.text({
      message: '2. Description en une ligne',
      validate: validateDescription,
    })
  ).trim();

  // 3. Profil : une seule réponse possible en v1, on l'annonce au lieu de la demander.
  const first = input.profiles[0];
  if (first === undefined) {
    throw new PrepworkError('CATALOG_NOT_FOUND', 'aucun profil disponible dans le catalogue');
  }
  let profile = first.id;
  if (input.profiles.length === 1) {
    prompter.note(
      [first.summary, ...first.whenToUse.map((t) => `- ${t}`)].join('\n'),
      `3. Profil d'architecture : ${first.id}`,
    );
  } else {
    profile = await prompter.select<string>({
      message: "3. Profil d'architecture",
      options: input.profiles.map((p) => ({ value: p.id, label: p.id, hint: p.summary })),
      initialValue: first.id,
    });
  }

  // 4-5. Ce qui façonne chaque feature
  const data = await prompter.select<Data>({
    message: '4. Données serveur',
    options: [
      { value: 'tanstack-query', label: 'TanStack Query', hint: 'cache, invalidation, réessais' },
      { value: 'none', label: 'Aucune', hint: 'chaque écran porte ses trois états' },
    ],
    initialValue: 'tanstack-query',
  });
  const forms = await prompter.select<Forms>({
    message: '5. Formulaires',
    options: [
      { value: 'rhf', label: 'react-hook-form + zod', hint: 'un schéma, un type' },
      { value: 'none', label: 'Aucune', hint: 'champs contrôlés à la main' },
    ],
    initialValue: 'rhf',
  });

  // 6. État client
  const state = await prompter.select<State>({
    message: '6. État client',
    options: [
      { value: 'zustand', label: 'zustand', hint: 'petits stores, sélecteurs' },
      { value: 'context', label: 'Contexte React', hint: 'un provider par sujet' },
    ],
    initialValue: 'zustand',
  });

  // 7. Authentification, 7a. chemin de connexion
  const security = await prompter.select<Security>({
    message: '7. Authentification',
    options: [
      { value: 'none', label: 'Aucune', hint: 'API ouverte ou réseau de confiance' },
      { value: 'oidc-bff', label: 'OIDC via un backend-for-frontend', hint: 'cookie http-only' },
      { value: 'session', label: 'Cookie de session posé par l’API' },
    ],
    initialValue: 'none',
  });
  const extras: ComposeExtras = {};
  if (security === 'oidc-bff') {
    const loginPath = await prompter.text({
      message: '7a. Chemin de connexion du backend-for-frontend (va dans .env.example)',
      placeholder: '/bff/login',
      validate: validatePath,
    });
    // Nom déclaré par l'option, sans préfixe : le contexte du pack le préfixera selon le profil.
    extras.envOverrides = { AUTH_LOGIN_PATH: loginPath };
  }

  // 8-10. Options du projet
  const i18n = await prompter.confirm({
    message: '8. Interface traduite (i18next) ?',
    initialValue: false,
  });
  const e2e = await prompter.confirm({
    message: '9. Tests de bout en bout avec Playwright ?',
    initialValue: true,
  });
  const docker = await prompter.confirm({
    message: '10. Générer Dockerfile, nginx et compose.yaml ?',
    initialValue: true,
  });
  const ci = await prompter.select<Ci>({
    message: '11. Intégration continue',
    options: [
      { value: 'github', label: 'GitHub Actions' },
      { value: 'gitlab', label: 'GitLab CI' },
      { value: 'none', label: 'Aucune' },
    ],
    initialValue: 'github',
  });

  // 12-13. Contrat visuel
  const preset = await prompter.select<Preset>({
    message: '12. Preset visuel',
    options: DESIGN_PRESET_IDS.map((id) => ({
      value: id,
      label: id,
      hint: PRESET_HINT[id] ?? '',
    })),
    initialValue: 'app-sober',
  });
  const dark = await prompter.confirm({
    message: '13. Thème sombre ?',
    initialValue: true,
  });

  // 14-15. Git
  const authorName = await prompter.text({
    message: '14. Auteur des commits — nom',
    initialValue: input.gitIdentity?.name,
    validate: (v) => (v.trim().length > 0 ? undefined : 'nom requis'),
  });
  const authorEmail = await prompter.text({
    message: '14. Auteur des commits — e-mail',
    initialValue: input.gitIdentity?.email,
    validate: validateEmail,
  });
  const agentTrailer = await prompter.confirm({
    message: "15. Ajouter le trailer Co-Authored-By: Claude aux commits de l'agent ?",
    initialValue: true,
  });

  // 16-17. Langues
  const languageOptions = [
    { value: 'fr' as const, label: 'Français' },
    { value: 'en' as const, label: 'Anglais' },
  ];
  const comments = await prompter.select({
    message: '16. Langue des commentaires',
    options: languageOptions,
    initialValue: 'fr',
  });
  const docs = await prompter.select({
    message: '17. Langue de la documentation',
    options: languageOptions,
    initialValue: 'fr',
  });

  const scaffold = ScaffoldSchema.parse({
    scaffold_version: SCAFFOLD_VERSION,
    project: { name, description },
    stack: { data, forms },
    profile,
    options: { state, security, i18n, e2e, docker, ci },
    design: { preset, dark },
    git: {
      author: { name: authorName.trim(), email: authorEmail.trim() },
      agent_trailer: agentTrailer,
    },
    language: { comments, docs },
  });

  // 18. Récapitulatif et confirmation
  prompter.note(summary(scaffold), '18. Récapitulatif');
  const confirmed = await prompter.confirm({
    message: 'Générer le projet avec ces choix ?',
    initialValue: true,
  });
  if (!confirmed) {
    prompter.outro("Rien n'a été généré.");
    throw new PrepworkError('CANCELLED', 'génération annulée au récapitulatif');
  }
  return { scaffold, extras };
}
