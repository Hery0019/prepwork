# back-office

Back office

## Démarrer

```bash
cp .env.example .env
uv sync
uv run uvicorn back_office.api.app:create_app --factory --reload
```

L'API écoute sur http://localhost:8000 et sa documentation est sur /docs (absente en production, CORE-036).

## Vérifier

| Commande | Rôle |
| --- | --- |
| `uv run pytest` | les trois niveaux de test |
| `uv run pytest -m "not integration"` | les mêmes, sans Docker |
| `uv run lint-imports` | vérifie le contrat de couches |
| `uv run mypy src tests` | le typage strict, qui tient ici le rôle du compilateur |
| `uv run ruff format && uv run ruff check --fix` | formate et corrige, avant chaque commit |

Le niveau `integration` a besoin de Docker : `uv run pytest -m "not integration"` est ce qui tourne sans lui.

## Conventions

Les conventions du projet sont dans `CLAUDE.md` et `.claude/skills/`, générés depuis `scaffold.yaml`. Ne pas les éditer à la main : modifier `scaffold.yaml`, puis relancer `prepwork sync`.

Les frontières de couches sont tenues par `.importlinter`, et par rien d'autre : Python n'a pas de compilateur. Y ajouter une exception supprime l'architecture en silence.
