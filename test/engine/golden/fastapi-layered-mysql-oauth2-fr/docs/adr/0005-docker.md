# ADR 0005 — Docker

Date : 2026-09-09 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork, avant la première ligne de code métier.

## Décision

**non**

## Conséquences

L'image finale ne porte ni uv, ni les sources, ni les dépendances de développement, et ne tourne pas en root. `compose.yaml` sert au développement local seulement.
