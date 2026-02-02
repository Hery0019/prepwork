<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# note-board

Interface rendue sur le serveur

Ce fichier est l'index des conventions du projet pour l'agent. Les détails sont dans les skills listés plus bas ; lire le skill concerné avant de toucher au code correspondant.

## Projet

|  |  |
|---|---|
| Nom | `note-board` |
| Profil d'architecture | `next-app` — Next.js App Router, rendu sur le serveur par défaut, un dossier par cas d'usage. |
| Données | aucune |
| Formulaires | aucune |
| État client | React context |
| Authentification | OIDC (BFF) |
| i18n | non |
| Tests e2e | non |
| Docker | oui |
| CI | GitHub Actions |
| Preset visuel | `app-sober` |
| Thème sombre | oui |
| Langues | commentaires en français, documentation en français |

## Règles permanentes

Ces règles s'appliquent à chaque intervention, quel que soit le fichier touché. Le détail et les anti-patterns sont dans le skill `workflow`.

- **CORE-001** — Avant tout changement non trivial (plus d'un fichier, un changement de schéma ou une nouvelle dépendance), l'agent écrit un plan court et attend confirmation.
- **CORE-002** — Une tâche est un changement cohérent et un commit ; refactoring et fonctionnalité ne sont jamais mélangés dans un même commit.
- **CORE-003** — L'agent ne crée jamais de commit `WIP`, `tmp` ou `fix later` ; un changement n'est commité que lorsque ses tests passent.
- **CORE-004** — Les tests sont écrits dans le même changement que le code qu'ils couvrent, jamais dans un commit ultérieur.
- **CORE-005** — Quand la spécification est ambiguë ou contradictoire, l'agent s'arrête et pose la question ; il ne choisit pas l'interprétation la plus probable.
- **CORE-006** — L'ajout d'une dépendance est un commit séparé qui suit la procédure de dépendances du profil.
- **CORE-007** — L'agent n'exécute jamais `git push`, `git reset --hard` ni `git clean`.
- **CORE-080** — Les identifiants du code (fichiers, composants, hooks, props, variables) sont toujours en anglais.
- **CORE-081** — Les commentaires et la documentation sont écrits dans la langue configurée du projet (voir la section réglages du projet).
- **CORE-082** — Un texte affiché à l'utilisateur n'est jamais un identifiant ; il vit dans le composant, ou dans les fichiers de traduction quand l'i18n est activée.
- **CORE-083** — Les termes métier sont définis dans `docs/glossary.md` et réutilisés tels quels dans les identifiants, sous leur forme anglaise.

## Skills

Un skill par sujet. Chaque règle y porte un identifiant stable (`NEXT-002`) à citer dans les plans et les revues.

| Skill | Contenu | Fichier |
|---|---|---|
| `architecture` | Couches, frontières entre features, index publics et exemple de référence. À lire avant de créer un fichier ou un dossier. | `.claude/skills/architecture/SKILL.md` |
| `ui` | Tokens, typographie, variantes et états obligatoires d'un composant. À lire avant d'écrire du JSX ou une classe. | `.claude/skills/ui/SKILL.md` |
| `a11y` | Rôles, libellés, clavier, contraste et mouvement. À lire avant de toucher au balisage. | `.claude/skills/a11y/SKILL.md` |
| `data` | Couche `api`, validation aux frontières, cache et formulaires. À lire avant d'appeler le réseau. | `.claude/skills/data/SKILL.md` |
| `testing` | Les trois niveaux, MSW, sélection par rôle. À lire avant d'écrire ou modifier un test. | `.claude/skills/testing/SKILL.md` |
| `workflow` | Plan, commits, dépendances, langue et commandes interdites. Le contrat de travail de l'agent. | `.claude/skills/workflow/SKILL.md` |
| `security` | Secrets, contenu injecté, en-têtes et authentification. À lire avant de toucher à la configuration ou à l'authentification. | `.claude/skills/security/SKILL.md` |

## Comment lire une règle

Chaque règle est une phrase vérifiable, suivie de sa raison. Le marqueur après l'identifiant dit qui la fait respecter :

- `eslint-boundaries`, `dependency-cruiser`, `typescript`, `eslint`, `jsx-a11y`, `stylelint`, `prettier`, `vitest`, `playwright`, `commitlint`, `gitleaks` : contrainte outillée, le build, le lint ou le commit échoue si elle est violée.
- `guidance` : règle de conduite pour l'agent, vérifiée en revue, sans outil derrière.

## Commandes

- `pnpm dev` — démarre Vite en développement
- `pnpm build` — construit le bundle de production
- `pnpm lint` — ESLint, frontières de couches et accessibilité
- `pnpm test` — tests unitaires et de composants
- `pnpm e2e` — parcours de référence dans un navigateur
- `prepwork sync` — met à jour les fichiers générés après un changement de `scaffold.yaml`

## Propriété des fichiers

- Les fichiers listés dans `.scaffold/manifest.json` sont générés : ne pas les éditer, ils seraient écrasés ou signalés par `prepwork sync`.
- `docs/adr/`, `docs/glossary.md` et tout le code métier appartiennent à l'équipe et ne sont jamais dans le manifeste.
- L'exemple de référence (`Note`) est généré ; le supprimer ou le modifier est un choix d'équipe, `sync` le signale sans le recréer.

## Git

- Auteur des commits : `Hery <hery@example.com>`
- Chaque commit de l'agent porte le trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Interdit à l'agent : `git push`, `git reset --hard`, `git clean`.

