# ADR 0003 — Database and migrations

Date : 2026-09-02 · Status : accepted

## Context

Choice made in the prepwork questionnaire. The schema only changes through versioned migrations; tests run on the real engine through Testcontainers, never on H2 (CORE-021).

## Decision

**No database** for now. The reference example uses an in-memory repository; adding a database later goes through `scaffold.yaml` then `prepwork sync`.

## Consequences

Every schema change is a migration committed with the code that uses it; deleting a migration is forbidden to the agent (CORE-007).
