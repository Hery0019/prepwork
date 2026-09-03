# ADR 0001 — Profil d'architecture

Date : 2026-09-03 · Statut : accepté

## Contexte

Le projet démarre et doit fixer où vit chaque fichier avant que les premières features ne le décident à sa place.

## Décision

Profil `next-app` — Next.js App Router, rendu sur le serveur par défaut, un dossier par cas d'usage.

- `src/app` — peut dépendre de features, entities, shared
- `src/features/*` — peut dépendre de entities, shared
- `src/entities/*` — peut dépendre de shared
- `src/shared` — ne dépend de rien

## Conséquences

Les frontières sont vérifiées par ESLint et dependency-cruiser : une violation échoue au lint, pas en revue. Changer de profil ensuite est une refonte, pas un réglage.
