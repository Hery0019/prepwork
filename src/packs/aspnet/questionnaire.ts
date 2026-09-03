// Le questionnaire du pack `aspnet` (ADR 0010) : ordre fixe, valeurs par défaut entre crochets,
// réponses validées, puis récapitulatif et confirmation. Une question dont la réponse est unique
// n'est pas posée : elle est annoncée. La version du SDK n'est jamais demandée.
import { PROJECT_NAME_PATTERN, SCAFFOLD_VERSION } from '../../config/schema.js';
import type { ComposeExtras } from '../../engine/context.js';
import { PrepworkError } from '../../errors.js';
import type { Prompter } from '../../questionnaire/prompter.js';
import type { QuestionnaireInput } from '../types.js';
import {
  defaultRootNamespace,
  rootNamespaceProblem,
  ScaffoldSchema,
  STACK_TARGET,
  type Ci,
  type Database,
  type Scaffold,
  type Security,
} from './scaffold.js';

/** Profils proposés au questionnaire. */
export type ProfileChoice = QuestionnaireInput['profiles'][number];

export interface AspnetQuestionnaireResult {
  scaffold: Scaffold;
  extras: ComposeExtras;
}

function validateProjectName(value: string): string | undefined {
  return PROJECT_NAME_PATTERN.test(value)
    ? undefined
    : 'nom en kebab-case attendu (lettres minuscules, chiffres, tirets), ex. pay-flow';
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

function validateAuthority(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? undefined
      : 'URL http(s) attendue';
  } catch {
    return 'URL invalide';
  }
}

function summary(scaffold: Scaffold): string {
  return [
    `Projet         ${scaffold.project.name} — ${scaffold.project.description}`,
    `Namespace      ${scaffold.project.root_namespace}`,
    `.NET           10 (LTS, épinglé par l'outil)`,
    `Base           ${scaffold.stack.database}`,
    `Profil         ${scaffold.profile}`,
    `Sécurité       ${scaffold.options.security}`,
    `Docker         ${scaffold.options.docker ? 'oui' : 'non'}`,
    `CI             ${scaffold.options.ci}`,
    `Auteur git     ${scaffold.git.author.name} <${scaffold.git.author.email}>${scaffold.git.agent_trailer ? ' + trailer Co-Authored-By' : ''}`,
    `Langues        commentaires ${scaffold.language.comments}, docs ${scaffold.language.docs}`,
  ].join('\n');
}

export async function runQuestionnaire(
  prompter: Prompter,
  input: QuestionnaireInput,
): Promise<AspnetQuestionnaireResult> {
  const first = input.profiles[0];
  if (first === undefined) {
    throw new PrepworkError('CATALOG_NOT_FOUND', 'aucun profil disponible dans le catalogue');
  }
  prompter.intro('prepwork — préparation du projet');

  // 1-3. Identité du projet
  const name = await prompter.text({
    message: '1. Nom du projet (kebab-case)',
    placeholder: 'pay-flow',
    validate: validateProjectName,
  });
  const rootNamespace = await prompter.text({
    message: '2. Espace de noms racine',
    initialValue: defaultRootNamespace(name),
    validate: rootNamespaceProblem,
  });
  const description = (
    await prompter.text({
      message: '3. Description en une ligne',
      validate: validateDescription,
    })
  ).trim();

  // 4. Base de données. Les migrations sont celles d'EF Core : aucun choix à faire (ADR 0010 §3).
  const database = await prompter.select<Database>({
    message: '4. Base de données',
    options: [
      { value: 'postgresql', label: 'PostgreSQL', hint: 'Npgsql' },
      { value: 'sqlserver', label: 'SQL Server', hint: 'image de test volumineuse' },
      { value: 'none', label: 'Aucune', hint: 'dépôt en mémoire, à remplacer plus tard' },
    ],
    initialValue: 'postgresql',
  });

  // 5. Profil : une seule réponse possible en v1, on l'annonce au lieu de la demander.
  let profile = first.id;
  if (input.profiles.length === 1) {
    prompter.note(
      [first.summary, ...first.whenToUse.map((t) => `- ${t}`)].join('\n'),
      `5. Profil d'architecture : ${first.id}`,
    );
  } else {
    profile = await prompter.select<string>({
      message: "5. Profil d'architecture",
      options: input.profiles.map((p) => ({ value: p.id, label: p.id, hint: p.summary })),
      initialValue: first.id,
    });
  }

  // 6. Sécurité, 6a. autorité des jetons
  const security = await prompter.select<Security>({
    message: '6. Authentification',
    options: [
      { value: 'none', label: 'Aucune', hint: 'réseau de confiance uniquement' },
      { value: 'cookie', label: 'Cookie de session', hint: 'application et API sur le même hôte' },
      { value: 'jwt-bearer', label: 'Jetons JWT', hint: 'fournisseur OIDC externe' },
    ],
    initialValue: 'none',
  });
  const extras: ComposeExtras = {};
  if (security === 'jwt-bearer') {
    const authority = await prompter.text({
      message: '6a. Autorité OIDC (va dans .env.example, pas dans scaffold.yaml)',
      placeholder: 'https://auth.example.com/realms/app',
      validate: validateAuthority,
    });
    extras.envOverrides = { JWT_AUTHORITY: authority };
  }

  // 7-8. Docker, CI
  const docker = await prompter.confirm({
    message: '7. Générer Dockerfile et compose.yaml ?',
    initialValue: true,
  });
  const ci = await prompter.select<Ci>({
    message: '8. Intégration continue',
    options: [
      { value: 'github', label: 'GitHub Actions' },
      { value: 'gitlab', label: 'GitLab CI' },
      { value: 'none', label: 'Aucune' },
    ],
    initialValue: 'github',
  });

  // 9-10. Git
  const authorName = await prompter.text({
    message: '9. Auteur des commits — nom',
    initialValue: input.gitIdentity?.name,
    validate: (v) => (v.trim().length > 0 ? undefined : 'nom requis'),
  });
  const authorEmail = await prompter.text({
    message: '9. Auteur des commits — e-mail',
    initialValue: input.gitIdentity?.email,
    validate: validateEmail,
  });
  const agentTrailer = await prompter.confirm({
    message: "10. Ajouter le trailer Co-Authored-By: Claude aux commits de l'agent ?",
    initialValue: true,
  });

  // 11-12. Langues
  const languageOptions = [
    { value: 'fr' as const, label: 'Français' },
    { value: 'en' as const, label: 'Anglais' },
  ];
  const comments = await prompter.select({
    message: '11. Langue des commentaires',
    options: languageOptions,
    initialValue: 'fr',
  });
  const docs = await prompter.select({
    message: '12. Langue de la documentation',
    options: languageOptions,
    initialValue: 'fr',
  });

  const scaffold = ScaffoldSchema.parse({
    scaffold_version: SCAFFOLD_VERSION,
    project: { name, root_namespace: rootNamespace.trim(), description },
    stack: { target: STACK_TARGET, database },
    profile,
    options: { security, docker, ci },
    git: {
      author: { name: authorName.trim(), email: authorEmail.trim() },
      agent_trailer: agentTrailer,
    },
    language: { comments, docs },
  });

  // 13. Récapitulatif et confirmation
  prompter.note(summary(scaffold), '13. Récapitulatif');
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
