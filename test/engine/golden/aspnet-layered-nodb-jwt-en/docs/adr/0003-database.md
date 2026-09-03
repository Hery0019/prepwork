# ADR 0003 — Database and migrations

Date : 2026-09-03 · Status : accepted

## Context

Choice made in the prepwork questionnaire. The migration tool is not a choice: EF Core ships its own. The schema only changes through migrations, and tests run on the real engine through Testcontainers, never on the `InMemory` provider (CORE-021).

## Decision

**No database** for now. The reference example uses an in-memory repository; adding a database later goes through `scaffold.yaml` then `prepwork sync`.

## Consequences

Every schema change is a migration committed with the code that uses it; deleting a migration is forbidden to the agent (CORE-007).
