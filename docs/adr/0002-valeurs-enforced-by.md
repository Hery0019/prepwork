# ADR 0002 — Valeurs de `enforced_by`

Date : 2026-09-02 · Statut : accepté

## Contexte

CLAUDE.md §3 fixe `archunit | spotless | commitlint | gitleaks | none`. Deux besoins n'y rentrent pas :
la vérification des modules Spring Modulith (`ApplicationModules.verify()`, profil `modular`) et
l'analyse de vulnérabilités en CI (règle CORE-035).

## Décision

L'énumération devient `archunit | spotless | commitlint | gitleaks | modulith | dependency-check | none`.
La sémantique reste la même : `none` = guidance pour l'agent, toute autre valeur = contrainte outillée,
et le renderer rend cette distinction visible.

Pour `archunit` et `modulith`, la vérification de contenu exige un test dont le nom contient l'id de la
règle (`LAY_002…`) dans les templates `src/test/` de la même source (core, profil ou option). Tant
qu'une source n'a aucun template, l'absence est un avertissement ; dès qu'elle en a, c'est une erreur.
