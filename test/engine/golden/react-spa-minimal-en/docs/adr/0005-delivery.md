# ADR 0005 — Delivery

Date : 2026-09-03 · Status : accepted

## Decision

- Docker : no
- Continuous integration : `none`
- End-to-end tests : no

## Consequences

Runtime configuration is injected when the container starts, never baked into the bundle: the same image goes from staging to production.
