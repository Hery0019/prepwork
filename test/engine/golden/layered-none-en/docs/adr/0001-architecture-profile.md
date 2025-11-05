# ADR 0001 — Architecture profile

Date : 2026-09-02 · Status : accepted

## Context

Choice made in the prepwork questionnaire, before the first line of business code. The profile dictates the skeleton, the ArchUnit rules, the anti-patterns and the reference example.

## Decision

Profile **`layered`** (version 1.0.0) : Layered monolith, one package per technical layer, dependencies flowing strictly downwards.

This profile fits when:

- A small team, one deployable, a domain that is still being discovered.
- CRUD-heavy applications where the business rules fit in services.
- The team knows Spring MVC and Spring Data and wants no extra framework.

It does not fit when:

- Several business domains with distinct vocabularies that will drift apart.
- Teams that plan to split the code base by domain later.

## Consequences

The profile rules are executable (`./mvnw verify`); switching profile is a migration, not a setting. Details live in `.claude/skills/architecture/SKILL.md`.
