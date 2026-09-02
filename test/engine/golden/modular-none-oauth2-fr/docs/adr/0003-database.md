# ADR 0003 — Base de données et migrations

Date : 2026-09-02 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork. Le schéma n'évolue que par migration versionnée ; les tests tournent sur le vrai moteur via Testcontainers, jamais sur H2 (CORE-021).

## Décision

**Aucune base de données** pour l'instant. L'exemple de référence utilise un repository en mémoire ; ajouter une base plus tard passe par `scaffold.yaml` puis `prepwork sync`.

## Conséquences

Toute modification de schéma est une migration commitée avec le code qui l'utilise ; supprimer une migration est interdit à l'agent (CORE-007).
