# ADR 0001 — Architecture profile

Date : 2026-09-03 · Status : accepted

## Context

The project starts and must decide where each file lives before the first features decide it instead.

## Decision

Profile `spa-feature` — Vite single-page application, one directory per use case, imports flowing strictly downwards.

- `src/app` — may depend on features, entities, shared
- `src/features/*` — may depend on entities, shared
- `src/entities/*` — may depend on shared
- `src/shared` — depends on nothing

## Consequences

The boundaries are checked by ESLint and dependency-cruiser: a violation fails the lint, not the review. Changing profile afterwards is a rewrite, not a setting.
