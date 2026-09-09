# ADR 0006 — Intégration continue

Date : 2026-09-09 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork, avant la première ligne de code métier.

## Décision

**github**

## Conséquences

Le pipeline exécute exactement ce qu'un développeur peut lancer localement. `lint-imports` y est une étape à part : un échec doit nommer le contrat de couches, pas « lint failed ».
