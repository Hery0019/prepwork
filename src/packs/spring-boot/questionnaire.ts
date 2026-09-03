// Le questionnaire du pack `spring-boot` (CLAUDE.md §5) : ordre fixe, valeurs par défaut entre
// crochets, réponses validées, puis récapitulatif et confirmation. Produit le scaffold et les
// valeurs qui n'y entrent pas (URL de l'issuer OAuth2 → .env.example).
import { PROJECT_NAME_PATTERN, SCAFFOLD_VERSION } from '../../config/schema.js';
import type { ComposeExtras } from '../../engine/context.js';
import { PrepworkError } from '../../errors.js';
import type { Prompter } from '../../questionnaire/prompter.js';
import type { ComposeExtras as Extras } from '../../engine/context.js';
import type { QuestionnaireInput } from '../types.js';

/** Profils proposés au questionnaire. */
export type ProfileChoice = QuestionnaireInput['profiles'][number];

/** Résultat typé du pack : le scaffold porte les champs Spring. */
export interface SpringQuestionnaireResult {
  scaffold: Scaffold;
  extras: Extras;
}
import {
  basePackageProblem,
  ScaffoldSchema,
  type Ci,
  type Database,
  type JavaVersion,
  type Migrations,
  type Scaffold,
  type Security,
} from './scaffold.js';

const ORACLE_WARNING =
  "L'image Testcontainers d'Oracle (gvenzl/oracle-free) pèse plusieurs gigaoctets : premier " +
  'lancement des tests long et espace disque à prévoir.';

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

function validateIssuer(value: string): string | undefined {
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
  const lines = [
    `Projet         ${scaffold.project.name} — ${scaffold.project.description}`,
    `Package        ${scaffold.project.base_package}`,
    `Java           ${scaffold.stack.java}`,
    `Base           ${scaffold.stack.database}${scaffold.stack.migrations ? ` (migrations ${scaffold.stack.migrations})` : ''}`,
    `Profil         ${scaffold.profile}`,
    `Sécurité       ${scaffold.options.security}`,
    `Docker         ${scaffold.options.docker ? 'oui' : 'non'}`,
    `CI             ${scaffold.options.ci}`,
    `Auteur git     ${scaffold.git.author.name} <${scaffold.git.author.email}>${scaffold.git.agent_trailer ? ' + trailer Co-Authored-By' : ''}`,
    `Langues        commentaires ${scaffold.language.comments}, docs ${scaffold.language.docs}`,
  ];
  return lines.join('\n');
}

export async function runQuestionnaire(
  prompter: Prompter,
  input: QuestionnaireInput,
): Promise<SpringQuestionnaireResult> {
  if (input.profiles.length === 0) {
    throw new PrepworkError('CATALOG_NOT_FOUND', 'aucun profil disponible dans le catalogue');
  }
  prompter.intro('prepwork — préparation du projet');

  // 1-3. Identité du projet
  const name = await prompter.text({
    message: '1. Nom du projet (kebab-case)',
    placeholder: 'pay-flow',
    validate: validateProjectName,
  });
  const basePackage = await prompter.text({
    message: '2. Package Java de base',
    placeholder: 'mg.solumada.payflow',
    validate: basePackageProblem,
  });
  const description = (
    await prompter.text({
      message: '3. Description en une ligne',
      validate: validateDescription,
    })
  ).trim();

  // 4. Java
  const java = await prompter.select<JavaVersion>({
    message: '4. Version de Java',
    options: [
      { value: 21, label: 'Java 21 (LTS, recommandé)' },
      { value: 17, label: 'Java 17 (LTS)' },
    ],
    initialValue: 21,
  });

  // 5. Base de données, 5a. migrations
  const database = await prompter.select<Database>({
    message: '5. Base de données',
    options: [
      { value: 'postgresql', label: 'PostgreSQL' },
      { value: 'mysql', label: 'MySQL' },
      { value: 'oracle', label: 'Oracle', hint: 'image de test volumineuse' },
      { value: 'none', label: 'Aucune', hint: 'repository en mémoire, à remplacer plus tard' },
    ],
    initialValue: 'postgresql',
  });
  if (database === 'oracle') prompter.note(ORACLE_WARNING, 'Attention');
  let migrations: Migrations | undefined;
  if (database !== 'none') {
    migrations = await prompter.select<Migrations>({
      message: '5a. Outil de migrations',
      options: [
        { value: 'flyway', label: 'Flyway', hint: 'SQL versionné' },
        { value: 'liquibase', label: 'Liquibase', hint: 'changelogs YAML' },
      ],
      initialValue: 'flyway',
    });
  }

  // 6. Profil
  const profile = await prompter.select<string>({
    message: "6. Profil d'architecture",
    options: input.profiles.map((p) => ({
      value: p.id,
      label: p.id,
      hint: p.summary,
    })),
    initialValue: input.profiles.some((p) => p.id === 'layered')
      ? 'layered'
      : input.profiles[0]?.id,
  });
  const chosen = input.profiles.find((p) => p.id === profile);
  if (chosen && chosen.whenToUse.length > 0) {
    prompter.note(chosen.whenToUse.map((t) => `- ${t}`).join('\n'), `Quand ${profile} convient`);
  }

  // 7. Sécurité, 7a. issuer
  const security = await prompter.select<Security>({
    message: '7. Sécurité',
    options: [
      { value: 'none', label: 'Aucune', hint: 'réseau de confiance uniquement' },
      { value: 'session', label: 'Session HTTP', hint: 'Spring Security, formulaire / basic' },
      { value: 'oauth2-resource-server', label: 'OAuth2 resource server', hint: 'jetons JWT' },
    ],
    initialValue: 'none',
  });
  const extras: ComposeExtras = {};
  if (security === 'oauth2-resource-server') {
    const issuer = await prompter.text({
      message: "7a. URL de l'issuer OAuth2 (va dans .env.example, pas dans scaffold.yaml)",
      placeholder: 'https://auth.example.com/realms/app',
      validate: validateIssuer,
    });
    extras.envOverrides = { OAUTH2_ISSUER_URI: issuer };
  }

  // 8-9. Docker, CI
  const docker = await prompter.confirm({
    message: '8. Générer Dockerfile et compose.yaml ?',
    initialValue: true,
  });
  const ci = await prompter.select<Ci>({
    message: '9. Intégration continue',
    options: [
      { value: 'github', label: 'GitHub Actions' },
      { value: 'gitlab', label: 'GitLab CI' },
      { value: 'none', label: 'Aucune' },
    ],
    initialValue: 'github',
  });

  // 10-11. Git
  const authorName = await prompter.text({
    message: '10. Auteur des commits — nom',
    initialValue: input.gitIdentity?.name,
    validate: (v) => (v.trim().length > 0 ? undefined : 'nom requis'),
  });
  const authorEmail = await prompter.text({
    message: '10. Auteur des commits — e-mail',
    initialValue: input.gitIdentity?.email,
    validate: validateEmail,
  });
  const agentTrailer = await prompter.confirm({
    message: "11. Ajouter le trailer Co-Authored-By: Claude aux commits de l'agent ?",
    initialValue: true,
  });

  // 12-13. Langues
  const languageOptions = [
    { value: 'fr' as const, label: 'Français' },
    { value: 'en' as const, label: 'Anglais' },
  ];
  const comments = await prompter.select({
    message: '12. Langue des commentaires',
    options: languageOptions,
    initialValue: 'fr',
  });
  const docs = await prompter.select({
    message: '13. Langue de la documentation',
    options: languageOptions,
    initialValue: 'fr',
  });

  const scaffold = ScaffoldSchema.parse({
    scaffold_version: SCAFFOLD_VERSION,
    project: { name, base_package: basePackage, description },
    stack: migrations === undefined ? { java, database } : { java, database, migrations },
    profile,
    options: { security, docker, ci },
    git: {
      author: { name: authorName.trim(), email: authorEmail.trim() },
      agent_trailer: agentTrailer,
    },
    language: { comments, docs },
  });

  // 14. Récapitulatif et confirmation
  prompter.note(summary(scaffold), '14. Récapitulatif');
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
