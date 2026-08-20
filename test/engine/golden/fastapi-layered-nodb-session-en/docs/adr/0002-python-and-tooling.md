# ADR 0002 — Python, uv and the tooling

Date : 2026-09-09 · Status : accepted

## Context

Pinned by prepwork, never asked in the questionnaire: the Python version, the package manager and the quality tools. A project that picks them itself picks them once, then drifts.

## Decision

| Item | Value |
| --- | --- |
| Python | `3.13`, written in `.python-version` |
| Packages | `uv`, with `uv.lock` committed and `uv sync --frozen` in CI |
| Lint / format | `ruff` |
| Typing | `mypy --strict` |
| Boundaries | `import-linter`, contracts in `.importlinter` |
| Tests | `pytest`, three levels separated by a marker |

## Consequences

Python has no compiler: `mypy` is the only step that refuses code before it runs, and `.importlinter` is the only thing holding the layer boundaries. Removing either from the pipeline breaks nothing immediately — which is exactly what makes the removal dangerous.
