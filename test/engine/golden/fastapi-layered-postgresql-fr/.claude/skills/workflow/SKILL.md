---
name: "workflow"
description: "Plan, commits, dépendances, langue et commandes interdites. Le contrat de travail de l'agent."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Workflow de l'agent

Ces règles décrivent comment l'agent travaille dans ce dépôt : avant de coder, pendant, au moment de commiter.

Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.

## Règles de base

### Règles

- **CORE-001** · guidance — Avant tout changement non trivial (plus d'un fichier, un changement de schéma ou une nouvelle dépendance), l'agent écrit un plan court et attend confirmation.
  Pourquoi : Un plan relu en trente secondes évite une heure de travail dans la mauvaise direction.
- **CORE-002** · guidance — Une tâche est un changement cohérent et un commit ; refactoring et fonctionnalité ne sont jamais mélangés dans un même commit.
  Pourquoi : Historique relisible ; un commit peut être annulé sans perdre un travail sans rapport.
- **CORE-003** · guidance — L'agent ne crée jamais de commit `WIP`, `tmp` ou `fix later` ; un changement n'est commité que lorsque ses tests passent.
  Pourquoi : Chaque commit de la branche doit être un état sur lequel l'équipe peut s'appuyer.
- **CORE-004** · guidance — Les tests sont écrits dans le même changement que le code qu'ils couvrent, jamais dans un commit ultérieur.
  Pourquoi : Un changement sans ses tests n'est pas terminé ; les reporter est le meilleur moyen de ne jamais les écrire.
- **CORE-005** · guidance — Quand la spécification est ambiguë ou contradictoire, l'agent s'arrête et pose la question ; il ne choisit pas l'interprétation la plus probable.
  Pourquoi : Une mauvaise supposition coûte bien plus à défaire qu'une question à répondre.
- **CORE-006** · guidance — L'ajout d'une dépendance est un commit séparé qui suit la procédure de dépendances du profil.
  Pourquoi : Une dépendance est un engagement de long terme ; elle mérite sa propre revue.
- **CORE-007** · guidance — L'agent n'exécute jamais `git push`, `git reset --hard` ni `git clean`.
  Pourquoi : Ces actions sont irréversibles ou touchent un état partagé ; seul un humain les prend.
- **CORE-040** · guidance — Les identifiants du code (modules, classes, fonctions, variables, colonnes) sont toujours en anglais.
  Pourquoi : Frameworks, bibliothèques et documentation sont en anglais ; mélanger les langues produit `get_utilisateur_by_id`.
- **CORE-041** · guidance — Les commentaires et les docstrings sont écrits dans la langue configurée du projet (voir la section réglages du projet).
  Pourquoi : C'est l'équipe qui les lit ; la langue est un choix d'équipe enregistré une fois dans `scaffold.yaml`.
- **CORE-042** · guidance — Les termes métier sont définis dans `docs/glossary.md` et réutilisés tels quels dans les identifiants, sous leur forme anglaise.
  Pourquoi : Un concept, un mot ; les synonymes dans le code sont des bugs en attente.

### Anti-patterns

- **CORE-AP-001** · guidance — Commiter un changement à moitié fait pour « sauvegarder l'avancement ».
  Pourquoi : La branche contient alors des états qui ne compilent pas ou ne passent pas les tests.
  À la place : Terminer l'étape cohérente, lancer les tests, puis commiter ; garder le travail inachevé dans l'arbre de travail.
- **CORE-AP-002** · guidance — Deviner le comportement attendu quand la spécification n'est pas claire.
  Pourquoi : La supposition est invisible pour le relecteur et devient une décision silencieuse.
  À la place : S'arrêter et poser une question concrète qui liste les interprétations envisagées.
- **CORE-AP-003** · guidance — Glisser un refactoring dans un commit de fonctionnalité « tant qu'on y est ».
  Pourquoi : Le diff mélange intention et bruit ; le relecteur ne sait plus quelles lignes changent le comportement.
  À la place : Faire du refactoring un commit à part, avant ou après la fonctionnalité.

### Réglages du projet

|  |  |
|---|---|
| Langue des commentaires | français |
| Langue de la documentation | français |
| Auteur des commits | Hery <hery@example.com> |
| Trailer de co-auteur | `Co-Authored-By: Claude <noreply@anthropic.com>` |

## Option `docker`

Image multi-étapes de l'application et pile compose avec la base choisie.

### Règles

- **DOCK-001** · guidance — L'image est construite en deux étapes ; la finale ne porte ni `uv`, ni les sources, ni les dépendances de développement.
  Pourquoi : Ce qui n'est pas dans l'image ne peut pas y être exploité, et le pull est plus rapide.
- **DOCK-002** · guidance — L'application tourne sous un utilisateur non root déclaré dans l'image.
  Pourquoi : Une évasion de conteneur qui démarre en root est une compromission de l'hôte.
- **DOCK-003** · guidance — Les dépendances sont installées depuis `uv.lock` avec `uv sync --frozen --no-dev`, avant la copie des sources.
  Pourquoi : `--frozen` construit exactement ce qui est commité, et l'ordre des couches garde l'installation en cache d'un changement de code à l'autre.
- **DOCK-004** · `gitleaks` — `compose.yaml` sert au développement local seulement ; aucun secret ni valeur de production n'y est écrit.
  Pourquoi : Un fichier compose est commité, lu par tout le monde et recopié dans des scripts de déploiement.

### Anti-patterns

- **DOCK-AP-001** · guidance — Une image en une seule étape construite depuis l'image Python complète, sources incluses.
  Pourquoi : L'image emporte un compilateur, les tests et l'historique, le tout déployé.
  À la place : Les deux étapes de DOCK-001, la seconde ne portant que l'environnement virtuel et le paquet.
- **DOCK-AP-002** · guidance — `uv sync` sans `--frozen` dans l'image, « pour prendre les derniers correctifs ».
  Pourquoi : L'image cesse d'être reproductible, et un build du même commit produit deux images différentes.
  À la place : Mettre à jour le lockfile dans un commit dédié, qui se relit.

## Option `ci-github`

Pipeline GitHub Actions qui exécute les vérifications, les trois niveaux de test et le contrôle des migrations.

### Règles

- **CIGH-001** · `format` — Le pipeline exécute `ruff format --check`, `ruff check`, `mypy`, `lint-imports` et `pytest` à chaque push et pull request.
  Pourquoi : La CI doit exécuter exactement ce qu'un développeur peut lancer localement, ni plus ni moins.
- **CIGH-002** · guidance — `lint-imports` est une étape à part entière, jamais fondue dans l'étape de lint.
  Pourquoi : C'est la seule chose qui tient l'architecture ; un échec doit nommer le contrat de couches, pas « lint failed ».
- **CIGH-003** · guidance — La version de Python vient de `.python-version` et les dépendances de `uv.lock` via `uv sync --frozen` ; le workflow n'en épingle jamais d'autre.
  Pourquoi : Deux sources de vérité pour une version produisent une CI verte et une machine rouge.
- **CIGH-004** · guidance — Un pipeline rouge bloque la fusion ; rien n'est fusionné avec une vérification en échec.
  Pourquoi : Une vérification qu'on peut ignorer cesse d'être une vérification.

## Option `git`

Commits conventionnels, auteur déclaré, trailer d'agent optionnel, hooks pour les messages de commit et les secrets.

### Règles

- **GIT-001** · `commitlint` — Les messages de commit suivent Conventional Commits (`type(scope): subject`, sujet de 72 caractères au plus), vérifiés par le hook `commit-msg`.
  Pourquoi : L'historique devient un changelog lisible par les machines et les humains.
- **GIT-002** · guidance — Les commits sont signés avec l'identité déclarée dans `scaffold.yaml` (`git.author`), jamais avec une valeur par défaut de la machine.
  Pourquoi : L'auteur est une décision d'équipe enregistrée une fois, pas un accident local.
- **GIT-003** · guidance — Quand `git.agent_trailer` est activé dans `scaffold.yaml`, chaque commit écrit par l'agent se termine par le trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
  Pourquoi : L'équipe distingue dans l'historique les commits écrits par l'agent.
- **GIT-004** · guidance — Les hooks de `.githooks/` sont actifs sur chaque clone (`git config core.hooksPath .githooks`) ; un commit qui les a contournés est refusé en revue.
  Pourquoi : Les hooks ne protègent le dépôt que si tout le monde les exécute.
- **GIT-005** · guidance — Les sorties de build, fichiers d'IDE et `.env` sont ignorés via `.gitignore` ; rien de produit par le build n'est jamais commité.
  Pourquoi : Le dépôt contient des sources et des décisions, rien qui puisse être régénéré.
- **GIT-006** · `gitleaks` — Le hook `pre-commit` lance gitleaks et refuse le commit quand un secret est indexé.
  Pourquoi : Un secret poussé une fois doit être considéré comme compromis, quoi qu'il arrive ensuite.

### Anti-patterns

- **GIT-AP-001** · guidance — `git commit --no-verify` pour passer outre un hook qui échoue.
  Pourquoi : Le hook a échoué pour une raison, un message mal formé ou un secret dans le diff.
  À la place : Corriger le message ou retirer le secret, puis commiter à nouveau.
