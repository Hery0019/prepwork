# ADR 0002 — Python, uv et l'outillage

Date : 2026-09-09 · Statut : acceptée

## Contexte

Épinglé par prepwork, jamais demandé au questionnaire : la version de Python, le gestionnaire de paquets et les outils de qualité. Un projet qui les choisit lui-même les choisit une fois, puis dérive.

## Décision

| Élément | Valeur |
| --- | --- |
| Python | `3.13`, écrite dans `.python-version` |
| Paquets | `uv`, avec `uv.lock` commité et `uv sync --frozen` en CI |
| Lint / format | `ruff` |
| Typage | `mypy --strict` |
| Frontières | `import-linter`, contrats dans `.importlinter` |
| Tests | `pytest`, trois niveaux séparés par un marqueur |

## Conséquences

Python n'a pas de compilateur : `mypy` est la seule étape qui refuse du code avant son exécution, et `.importlinter` la seule chose qui tient les frontières de couches. Retirer l'un ou l'autre du pipeline ne casse rien immédiatement — c'est précisément ce qui rend la suppression dangereuse.
