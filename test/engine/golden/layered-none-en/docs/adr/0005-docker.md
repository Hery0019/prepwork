# ADR 0005 — Docker

Date : 2026-09-02 · Status : accepted

## Context

Choice made in the prepwork questionnaire: whether to ship a Docker image and a `compose.yaml` for the local environment.

## Decision

**No** for now. The option can be enabled in `scaffold.yaml` then `prepwork sync`.

## Consequences

Slice and integration tests require Docker anyway (Testcontainers); this decision only concerns packaging.
