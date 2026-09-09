# ADR 0003 — Base de données

Date : 2026-09-09 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork, avant la première ligne de code métier.

## Décision

**mysql**

## Conséquences

Sans base, le dépôt de l'exemple de référence est une liste en mémoire ; le passage à une base est un changement de `scaffold.yaml`, suivi de `prepwork sync`.
