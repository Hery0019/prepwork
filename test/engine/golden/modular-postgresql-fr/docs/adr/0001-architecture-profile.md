# ADR 0001 — Profil d'architecture

Date : 2026-09-02 · Statut : acceptée

## Contexte

Choix fait au questionnaire prepwork, avant la première ligne de code métier. Le profil dicte le squelette, les règles ArchUnit, les anti-patterns et l'exemple de référence.

## Décision

Profil **`modular`** (version 1.0.0) : Monolithe modulaire avec Spring Modulith, un module par domaine métier, communication par événements.

Ce profil convient quand :

- Plusieurs domaines métier avec leur propre vocabulaire, qui doivent évoluer indépendamment.
- Une équipe qui veut des frontières explicites et vérifiées sans payer le prix des services distribués.
- Une base de code qu'on prévoit de découper par domaine plus tard.

Il ne convient pas quand :

- Un seul petit domaine où les modules ne seraient que de la cérémonie.
- Une équipe nouvelle sur Spring qui doit d'abord apprendre les bases du découpage en couches.

## Conséquences

Les règles du profil sont exécutables (`./mvnw verify`) ; changer de profil est une migration, pas un réglage. Le détail est dans `.claude/skills/architecture/SKILL.md`.
