# ADR 0004 — Sécurité

Date : 2026-09-03 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork. La sécurité de base (secrets par variables d'environnement, un seul endpoint de diagnostic, CORS explicite, en-têtes de réponse, audit NuGet) s'applique quel que soit ce choix.

## Décision

Option d'authentification : **`cookie`**

Authentification par cookie de session, adaptée à un front servi par la même origine. Le cookie est `HttpOnly`, `Secure` et `SameSite=Strict`.

## Conséquences

Le détail des règles est dans `.claude/skills/security/SKILL.md` ; changer d'option passe par `scaffold.yaml` puis `prepwork sync`.
