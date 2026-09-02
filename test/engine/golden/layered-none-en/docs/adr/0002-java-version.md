# ADR 0002 — Java version

Date : 2026-09-02 · Status : accepted

## Context

Spring Boot 4.1.1 (pinned by prepwork) supports Java 17 and 21 LTS.

## Decision

**Java 17**: operational constraint; move to 21 as soon as possible.

## Consequences

`java.version` is set in `pom.xml`; the Dockerfile and CI use the same version.
