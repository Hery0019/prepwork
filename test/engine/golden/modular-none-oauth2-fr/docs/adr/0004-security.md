# ADR 0004 — Sécurité

Date : 2026-09-02 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork. La sécurité de base (secrets par variables d'environnement, Actuator restreint, CORS explicite, analyse des dépendances) s'applique quel que soit ce choix.

## Décision

Option d'authentification : **`oauth2-resource-server`**

Resource server OAuth2 : l'API valide des jetons JWT émis par un fournisseur d'identité externe (`OAUTH2_ISSUER_URI`).

## Conséquences

Le détail des règles est dans `.claude/skills/security/SKILL.md` ; changer d'option passe par `scaffold.yaml` puis `prepwork sync`.
