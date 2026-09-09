# ADR 0001 — Architecture profile

Date : 2026-09-09 · Status : accepted

## Context

Choice made in the prepwork questionnaire, before the first line of business code. The profile dictates the skeleton, the architecture rules, the anti-patterns and the reference example.

## Decision

Profile **`layered`** (version 1.0.0) : Layered monolith — api, service, repository, domain, one sub-package each.

This profile fits when:

- A single team, a single deployable, a domain that is not yet split.
- The team accepts that the layer boundaries are held by a pipeline step rather than by a build error.
- CRUD-heavy APIs whose business rules fit in application services.

It does not fit when:

- Several business domains that already have their own lifecycle.
- A team that wants one package per feature rather than one package per layer.

## Consequences

The profile rules are executable (`uv run pytest`); switching profile is a migration, not a setting. Details live in `.claude/skills/architecture/SKILL.md`.
