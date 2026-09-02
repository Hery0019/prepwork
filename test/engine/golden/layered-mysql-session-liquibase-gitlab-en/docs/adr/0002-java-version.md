# ADR 0002 — Java version

Date : 2026-09-02 · Status : accepted

## Context

Spring Boot 4.1.1 (pinned by prepwork) supports Java 17 and 21 LTS.

## Decision

**Java 21**: records, pattern matching and virtual threads available.

## Consequences

`java.version` is set in `pom.xml`; the Dockerfile and CI use the same version.
