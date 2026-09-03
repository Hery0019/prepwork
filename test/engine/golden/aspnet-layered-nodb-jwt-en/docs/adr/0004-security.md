# ADR 0004 — Security

Date : 2026-09-03 · Status : accepted

## Context

Choice made in the prepwork questionnaire. Baseline security (secrets through environment variables, a single diagnostic endpoint, explicit CORS, response headers, NuGet audit) applies whatever this choice.

## Decision

Authentication option : **`jwt-bearer`**

JWT tokens: the API validates tokens issued by an external OIDC provider (`JWT_AUTHORITY`), and never issues any itself.

## Consequences

Rule details live in `.claude/skills/security/SKILL.md`; changing the option goes through `scaffold.yaml` then `prepwork sync`.
