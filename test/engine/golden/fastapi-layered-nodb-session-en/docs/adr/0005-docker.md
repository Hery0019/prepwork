# ADR 0005 — Docker

Date : 2026-09-09 · Status : accepted

## Context

Choice made in the prepwork questionnaire, before the first line of business code.

## Decision

**no**

## Consequences

The final image carries neither uv, nor the sources, nor the dev dependencies, and does not run as root. `compose.yaml` is for local development only.
