# ADR 0002 — Visual contract

Date : 2026-09-03 · Status : accepted

## Context

Without a written visual contract, every screen invents its own typography, spacing and colours.

## Decision

Preset `dense`.

- Typography : system-ui, sans-serif / system-ui, sans-serif
- Scale : 1.125 · weights 400, 500, 600
- Base spacing : 4px · radius 4px

## Consequences

The values live in src/shared/styles/tokens.css, owned by the team: that is where the brand is adjusted. Every token becomes a utility class, and Stylelint refuses any colour written elsewhere.
