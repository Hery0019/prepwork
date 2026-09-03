---
name: "workflow"
description: "Plan, commits, dépendances, langue et commandes interdites. Le contrat de travail de l'agent."
---

<!-- Généré par prepwork 0.1.0 depuis `scaffold.yaml`. Ne pas éditer : modifier la source, puis `prepwork sync`. -->

# Workflow de l'agent

Ces règles décrivent comment l'agent travaille dans ce dépôt : avant de coder, en codant, en commitant.

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
- **CORE-080** · guidance — Les identifiants du code (fichiers, composants, hooks, props, variables) sont toujours en anglais.
  Pourquoi : Frameworks, bibliothèques et documentation sont en anglais ; mélanger les langues produit `useUtilisateurQuery`.
- **CORE-081** · guidance — Les commentaires et la documentation sont écrits dans la langue configurée du projet (voir la section réglages du projet).
  Pourquoi : C'est l'équipe qui les lit ; la langue est un choix d'équipe enregistré une fois dans `scaffold.yaml`.
- **CORE-082** · guidance — Un texte affiché à l'utilisateur n'est jamais un identifiant ; il vit dans le composant, ou dans les fichiers de traduction quand l'i18n est activée.
  Pourquoi : La langue de l'interface est une décision produit, sans rapport avec la langue du code.
- **CORE-083** · guidance — Les termes métier sont définis dans `docs/glossary.md` et réutilisés tels quels dans les identifiants, sous leur forme anglaise.
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

Image multi-étapes qui construit le bundle et le sert en fichiers statiques.

### Règles

- **DOCK-001** · guidance — L'image est construite par le `Dockerfile` multi-étapes depuis les sources, jamais depuis un bundle construit sur un poste.
  Pourquoi : La construction est alors reproductible et identique en CI et sur n'importe quel poste.
- **DOCK-002** · guidance — Le conteneur tourne avec un utilisateur non root et n'expose qu'un seul port.
  Pourquoi : Un processus compromis ne doit pas posséder le conteneur.
- **DOCK-003** · guidance — La configuration d'exécution est injectée au démarrage du conteneur, jamais figée dans le bundle à la construction.
  Pourquoi : Sinon la même image ne peut pas passer de la recette à la production.

## Option `ci-github`

Un workflow GitHub Actions lance les vérifications sur chaque pull request.

### Règles

- **CIGH-001** · guidance — Le workflow lance la vérification de types, le lint, les tests et le build sur chaque pull request.
  Pourquoi : Ce que la machine ne vérifie pas sur la branche, c'est l'utilisateur qui le vérifie en production.
- **CIGH-002** · guidance — Les dépendances sont installées depuis le fichier de verrouillage avec une installation figée.
  Pourquoi : Une résolution différente de celle du poste transforme la CI en loterie.

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
