# ADR 0003 — Data and state

Date : 2026-09-03 · Status : accepted

## Decision

- Server data : `none`
- Forms : `none`
- Client state : `context`

## Consequences

Every network call goes through the api/ module of a feature and its response is validated by a zod schema (CORE-040, CORE-041). Server state and client state never mix.
