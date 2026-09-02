# ADR 0004 — Sécurité

Date : 2026-09-02 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork. La sécurité de base (secrets par variables d'environnement, Actuator restreint, CORS explicite, analyse des dépendances) s'applique quel que soit ce choix.

## Décision

Option d'authentification : **`none`**

Aucune authentification : l'API n'est joignable que depuis un réseau de confiance. Passer à `session` ou `oauth2-resource-server` avant toute exposition publique.

## Conséquences

Le détail des règles est dans `.claude/skills/security/SKILL.md` ; changer d'option passe par `scaffold.yaml` puis `prepwork sync`.
