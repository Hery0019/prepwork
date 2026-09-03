# ADR 0002 — .NET version

Date : 2026-09-03 · Status : accepted

## Context

The SDK version is not asked in the questionnaire: it is pinned by the prepwork version, like the package versions are.

## Decision

**.NET 10 (LTS)**, target `net10.0`, SDK `10.0.400` declared in `global.json` with `rollForward: latestFeature`.

`rollForward` accepts a newer SDK in the same major band: an up-to-date machine builds, an out-of-date one fails with a clear message rather than an obscure compilation error.

## Consequences

`TargetFramework` is set once in `Directory.Build.props`; the Dockerfile and CI use the same version. Moving to another major version is a migration, with its own ADR.
