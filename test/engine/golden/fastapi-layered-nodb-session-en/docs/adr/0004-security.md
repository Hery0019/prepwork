# ADR 0004 — Security

Date : 2026-09-09 · Status : accepted

## Context

Choice made in the prepwork questionnaire, before the first line of business code.

## Decision

**session**

## Consequences

The `configure_security` contract is called by the composition root whatever the option, `none` included, whose version does nothing. Switching option is a change in `scaffold.yaml`, not a hand-made setup.
