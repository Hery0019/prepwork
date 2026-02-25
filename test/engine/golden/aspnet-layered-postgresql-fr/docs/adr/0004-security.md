# ADR 0004 — Sécurité

Date : 2026-09-03 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork. La sécurité de base (secrets par variables d'environnement, un seul endpoint de diagnostic, CORS explicite, en-têtes de réponse, audit NuGet) s'applique quel que soit ce choix.

## Décision

Option d'authentification : **`none`**

Aucune authentification : l'API n'est joignable que depuis un réseau de confiance. Passer à `cookie` ou `jwt-bearer` avant toute exposition publique.

## Conséquences

Le détail des règles est dans `.claude/skills/security/SKILL.md` ; changer d'option passe par `scaffold.yaml` puis `prepwork sync`.
