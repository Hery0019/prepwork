# ADR 0003 — Database and migrations

Date : 2026-09-02 · Status : accepted

## Context

Choice made in the prepwork questionnaire. The schema only changes through versioned migrations; tests run on the real engine through Testcontainers, never on H2 (CORE-021).

## Decision

- Engine : **mysql**
- Migrations : **liquibase**
- Hibernate validates the schema at startup (`ddl-auto: validate`); it never creates it.

## Consequences

Every schema change is a migration committed with the code that uses it; deleting a migration is forbidden to the agent (CORE-007).
