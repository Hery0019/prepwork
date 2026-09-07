# edge-api

Stateless edge API

## Getting started

```bash
cp .env.example .env
uv sync
uv run uvicorn edge_api.api.app:create_app --factory --reload
```

The API listens on http://localhost:8000 and its documentation is at /docs (absent in production, CORE-036).

## Checking

| Command | Purpose |
| --- | --- |
| `uv run pytest` | the three test levels |
| `uv run pytest -m "not integration"` | the same ones, without Docker |
| `uv run lint-imports` | checks the layer contract |
| `uv run mypy src tests` | strict typing, which plays the compiler role here |
| `uv run ruff format && uv run ruff check --fix` | format and fix, before every commit |

The `integration` level needs Docker: `uv run pytest -m "not integration"` is what runs without it.

## Conventions

The project conventions live in `CLAUDE.md` and `.claude/skills/`, generated from `scaffold.yaml`. Do not edit them by hand: change `scaffold.yaml`, then run `prepwork sync`.

The layer boundaries are held by `.importlinter`, and by nothing else: Python has no compiler. Adding an exception to it deletes the architecture quietly.
