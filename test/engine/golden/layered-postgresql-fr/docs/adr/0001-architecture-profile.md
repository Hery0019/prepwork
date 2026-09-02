# ADR 0001 — Profil d'architecture

Date : 2026-09-02 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork, avant la première ligne de code métier. Le profil dicte le squelette, les règles ArchUnit, les anti-patterns et l'exemple de référence.

## Décision

Profil **`layered`** (version 1.0.0) : Monolithe en couches, un package par couche technique, dépendances strictement descendantes.

Ce profil convient quand :

- Une petite équipe, un seul livrable, un domaine encore en cours de découverte.
- Des applications surtout CRUD dont les règles métier tiennent dans des services.
- L'équipe connaît Spring MVC et Spring Data et ne veut aucun framework supplémentaire.

Il ne convient pas quand :

- Plusieurs domaines métier aux vocabulaires distincts qui vont diverger.
- Des équipes qui prévoient de découper la base de code par domaine plus tard.

## Conséquences

Les règles du profil sont exécutables (`./mvnw verify`) ; changer de profil est une migration, pas un réglage. Le détail est dans `.claude/skills/architecture/SKILL.md`.
