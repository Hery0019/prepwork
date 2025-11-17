# ADR 0004 — Security

Date : 2026-09-02 · Status : accepted

## Context

Choice made in the prepwork questionnaire. Baseline security (secrets through environment variables, restricted Actuator, explicit CORS, dependency scanning) applies whatever this choice.

## Decision

Authentication option : **`session`**

HTTP session authentication (Spring Security), suited to a front end served from the same origin.

## Consequences

Rule details live in `.claude/skills/security/SKILL.md`; changing the option goes through `scaffold.yaml` then `prepwork sync`.
