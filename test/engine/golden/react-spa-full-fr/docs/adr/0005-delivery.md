# ADR 0005 — Livraison

Date : 2026-09-03 · Statut : accepté

## Décision

- Docker : oui, image multi-étapes servie par nginx
- Intégration continue : `github`
- Tests de bout en bout : Playwright

## Conséquences

La configuration d'exécution est injectée au démarrage du conteneur, jamais figée dans le bundle : la même image passe de la recette à la production.
