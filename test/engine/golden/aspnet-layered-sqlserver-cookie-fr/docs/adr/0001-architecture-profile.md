# ADR 0001 — Profil d'architecture

Date : 2026-09-03 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork, avant la première ligne de code métier. Le profil dicte le squelette, les règles d'architecture, les anti-patterns et l'exemple de référence.

## Décision

Profil **`layered`** (version 1.0.0) : Monolithe en couches — Api, Application, Infrastructure, Domain, un projet chacun.

Ce profil convient quand :

- Une seule équipe, un seul déployable, un domaine qui n'est pas encore découpé.
- L'équipe veut des frontières de couches tenues par le build plutôt que par la revue.
- Des applications surtout CRUD dont les règles métier tiennent dans des services applicatifs.

Il ne convient pas quand :

- Plusieurs domaines métier qui ont déjà leur propre cycle de vie.
- Une équipe qui veut un dossier par fonctionnalité plutôt qu'un projet par couche.

## Conséquences

Les règles du profil sont exécutables (`dotnet test`) ; changer de profil est une migration, pas un réglage. Le détail est dans `.claude/skills/architecture/SKILL.md`.
