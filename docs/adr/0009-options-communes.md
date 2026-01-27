# ADR 0009 — `content/common/options` : une option qui ne parle pas de la stack n'appartient à aucun pack

Date : 2026-09-03 · Statut : accepté

## Contexte

L'ADR 0007 a créé `content/common/` pour le seul `core/workflow.yaml`. En écrivant le pack `react`,
l'option `git` a été recopiée depuis le pack `spring-boot` : mêmes hooks, mêmes conventions de
commit, à un identifiant de règle près dans un commentaire. Deux copies d'un même fichier qui
doivent rester synchrones sont une dette, et le premier écart est déjà arrivé.

## Décision

`content/common/options/<id>/` existe, chargé avant les options du pack. L'option `git` y déménage :
règles de commit, auteur, trailer, hooks `commit-msg` et `pre-commit`.

Ce qui reste au pack : `.gitignore` et `.gitattributes`, qui nomment les répertoires de build de la
technologie (`target/` contre `node_modules/`, `dist/`). Ils passent donc du `git` de `spring-boot`
vers son `core/`, là où le pack `react` les avait déjà.

Trois conséquences de forme, toutes vérifiées par le chargeur ou le contrôle de cohérence :

- **Un identifiant déclaré des deux côtés est une erreur**, jamais une surcharge silencieuse — même
  règle que pour les ensembles `core/`.
- **Une option commune ne peut employer que des valeurs présentes dans tous les packs** : son
  `skill` et ses `enforced_by` sont validés par les schémas du pack en cours de chargement, donc un
  écart se voit au premier `check:content`.
- **Une option commune ne cite aucun identifiant de règle d'un pack.** Le hook `pre-commit`
  renvoyait à `CORE-031` côté Spring et `CORE-070` côté React ; l'option porte désormais sa propre
  règle `GIT-006` (« le hook refuse un commit contenant un secret »), et le hook la cite.

## Conséquences

- Le pack `react` gagne les règles de commit complètes de `spring-boot` (auteur déclaré, trailer,
  hooks actifs, `.gitignore`) qu'il n'avait qu'en version abrégée : sept golden files changent,
  délibérément.
- Les schémas JSON `common/option` et `common/files` sont générés à partir de l'union des valeurs
  des packs, comme `common/core`.
- Le critère pour placer une option dans `common/` : elle ne nomme aucune technologie. `docker` et
  `ci-*` n'y vont pas — le Dockerfile et le workflow parlent de Maven ou de pnpm.
