# ADR 0006 — Continuous integration

Date : 2026-09-09 · Status : accepted

## Context

Choice made in the prepwork questionnaire, before the first line of business code.

## Decision

**none**

## Consequences

The pipeline runs exactly what a developer can run locally. `lint-imports` is a step of its own: a failure must name the layer contract, not a bare lint failure.
