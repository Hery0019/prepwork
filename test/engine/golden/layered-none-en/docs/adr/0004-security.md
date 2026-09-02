# ADR 0004 — Security

Date : 2026-09-02 · Status : accepted

## Context

Choice made in the prepwork questionnaire. Baseline security (secrets through environment variables, restricted Actuator, explicit CORS, dependency scanning) applies whatever this choice.

## Decision

Authentication option : **`none`**

No authentication: the API is reachable only from a trusted network. Switch to `session` or `oauth2-resource-server` before any public exposure.

## Consequences

Rule details live in `.claude/skills/security/SKILL.md`; changing the option goes through `scaffold.yaml` then `prepwork sync`.
