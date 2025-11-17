# ADR 0005 — Docker

Date : 2026-09-02 · Status : accepted

## Context

Choice made in the prepwork questionnaire: whether to ship a Docker image and a `compose.yaml` for the local environment.

## Decision

**Yes**: multi-stage `Dockerfile` (Maven build, minimal JRE image, non-root user) and `compose.yaml` with the chosen database.

## Consequences

Slice and integration tests require Docker anyway (Testcontainers); this decision only concerns packaging.
