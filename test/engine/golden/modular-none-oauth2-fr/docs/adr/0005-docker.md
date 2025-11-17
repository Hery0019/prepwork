# ADR 0005 — Docker

Date : 2026-09-02 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork : livrer ou non une image Docker et un `compose.yaml` pour l'environnement local.

## Décision

**Non** pour l'instant. L'option peut être activée dans `scaffold.yaml` puis `prepwork sync`.

## Conséquences

Les tests slice et d'intégration exigent Docker de toute façon (Testcontainers) ; cette décision ne concerne que le packaging.
