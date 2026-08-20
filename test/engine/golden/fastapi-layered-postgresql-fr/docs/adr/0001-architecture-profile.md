# ADR 0001 — Profil d'architecture

Date : 2026-09-09 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork, avant la première ligne de code métier. Le profil dicte le squelette, les règles d'architecture, les anti-patterns et l'exemple de référence.

## Décision

Profil **`layered`** (version 1.0.0) : Monolithe en couches — api, service, repository, domain, un sous-paquet chacun.

Ce profil convient quand :

- Une seule équipe, un seul déployable, un domaine qui n'est pas encore découpé.
- L'équipe accepte que les frontières de couches soient tenues par une étape de pipeline plutôt que par une erreur de build.
- Des API surtout CRUD dont les règles métier tiennent dans des services applicatifs.

Il ne convient pas quand :

- Plusieurs domaines métier qui ont déjà leur propre cycle de vie.
- Une équipe qui veut un paquet par fonctionnalité plutôt qu'un paquet par couche.

## Conséquences

Les règles du profil sont exécutables (`uv run pytest`) ; changer de profil est une migration, pas un réglage. Le détail est dans `.claude/skills/architecture/SKILL.md`.
