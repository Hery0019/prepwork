# ADR 0005 — Docker

Date : 2026-09-02 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork : livrer ou non une image Docker et un `compose.yaml` pour l'environnement local.

## Décision

**Oui** : `Dockerfile` multi-étapes (build Maven, image JRE minimale, utilisateur non root) et `compose.yaml` avec la base de données choisie.

## Conséquences

Les tests slice et d'intégration exigent Docker de toute façon (Testcontainers) ; cette décision ne concerne que le packaging.
