# ADR 0001 — Architecture profile

Date : 2026-09-03 · Status : accepted

## Context

Choice made in the prepwork questionnaire, before the first line of business code. The profile dictates the skeleton, the architecture rules, the anti-patterns and the reference example.

## Decision

Profile **`layered`** (version 1.0.0) : Layered monolith — Api, Application, Infrastructure, Domain, one project each.

This profile fits when:

- A single team, a single deployable, a domain that is not yet split.
- The team wants the layer boundaries held by the build rather than by review.
- CRUD-heavy applications whose business rules fit in application services.

It does not fit when:

- Several business domains that already have their own lifecycle.
- A team that wants one folder per feature rather than one project per layer.

## Consequences

The profile rules are executable (`dotnet test`); switching profile is a migration, not a setting. Details live in `.claude/skills/architecture/SKILL.md`.
