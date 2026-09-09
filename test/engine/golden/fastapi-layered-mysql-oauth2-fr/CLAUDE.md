<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# back-office

Back office

Ce fichier est l'index des conventions du projet pour l'agent. Les détails sont dans les skills listés plus bas ; lire le skill concerné avant de toucher au code correspondant.

## Projet

|  |  |
|---|---|
| Nom | `back-office` |
| Paquet Python | `back_office` |
| Python | 3.13 |
| Base de données | MySQL |
| Profil d'architecture | `layered` — Monolithe en couches — api, service, repository, domain, un sous-paquet chacun. |
| Sécurité | `oauth2-resource-server` |
| Docker | non |
| CI | GitLab CI |
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
- **CORE-040** — Les identifiants du code (modules, classes, fonctions, variables, colonnes) sont toujours en anglais.
- **CORE-041** — Les commentaires et les docstrings sont écrits dans la langue configurée du projet (voir la section réglages du projet).
- **CORE-042** — Les termes métier sont définis dans `docs/glossary.md` et réutilisés tels quels dans les identifiants, sous leur forme anglaise.

## Skills

Un skill par sujet. Chaque règle y porte un identifiant stable (`PY-002`) à citer dans les plans et les revues.

| Skill | Contenu | Fichier |
|---|---|---|
| `architecture` | Couches, modules, sens des imports et exemple de référence du projet. À lire avant de créer un module ou d'ajouter un import. | `.claude/skills/architecture/SKILL.md` |
| `db` | Entités SQLAlchemy, session, dépôts, transactions et migrations Alembic. À lire avant de toucher au schéma ou à la persistance. | `.claude/skills/db/SKILL.md` |
| `api` | Routeurs, schémas Pydantic, format des erreurs, pagination et versionnement. À lire avant de créer ou de modifier un endpoint. | `.claude/skills/api/SKILL.md` |
| `testing` | Les trois niveaux, Testcontainers, marqueurs et nommage. À lire avant d'écrire ou de modifier un test. | `.claude/skills/testing/SKILL.md` |
| `workflow` | Plan, commits, dépendances, langue et commandes interdites. Le contrat de travail de l'agent. | `.claude/skills/workflow/SKILL.md` |
| `security` | Secrets, endpoints de diagnostic, CORS, en-têtes, scan des dépendances et option de sécurité du projet. À lire avant de toucher à la configuration ou à l'authentification. | `.claude/skills/security/SKILL.md` |

## Comment lire une règle

Chaque règle est une phrase vérifiable, suivie de sa raison. Le marqueur après l'identifiant dit qui la fait respecter :

- `import-linter` : le contrat de couches de `pyproject.toml`, vérifié par `lint-imports`. `mypy` : le typage strict, qui tient ici le rôle du compilateur — la sanction est une étape du pipeline, pas une erreur de build. `ruff`, `format`, `alembic`, `pip-audit`, `pytest`, `commitlint`, `gitleaks` : contrainte outillée, le pipeline ou le commit échoue si elle est violée.
- `guidance` : règle de conduite pour l'agent, vérifiée en revue, sans outil derrière.

## Commandes

- `uv sync` — installe l'environnement depuis `uv.lock`
- `uv run pytest` — les trois niveaux de test
- `uv run pytest -m "not integration"` — les mêmes, sans Docker
- `uv run lint-imports` — vérifie le contrat de couches
- `uv run mypy src tests` — le typage strict
- `uv run ruff format && uv run ruff check --fix` — formate et corrige (avant chaque commit)
- `prepwork sync` — met à jour les fichiers générés après un changement de `scaffold.yaml`

## Propriété des fichiers

- Les fichiers listés dans `.scaffold/manifest.json` sont générés : ne pas les éditer, ils seraient écrasés ou signalés par `prepwork sync`.
- `docs/adr/`, `docs/glossary.md` et tout le code métier appartiennent à l'équipe et ne sont jamais dans le manifeste.
- L'exemple de référence (`Note`) est généré ; le supprimer ou le modifier est un choix d'équipe, `sync` le signale sans le recréer.

## Git

- Auteur des commits : `Hery <hery@example.com>`
- Chaque commit de l'agent porte le trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Interdit à l'agent : `git push`, `git reset --hard`, `git clean`.

