"""Règles de persistance que le contrat de couches ne sait pas dire."""

from pathlib import Path

import pytest


@pytest.mark.unit
def test_PERS_004_the_schema_is_only_created_by_migrations() -> None:
    """Un schéma créé de deux façons fait deux schémas, et les migrations ne
    sont alors testées qu'en production.
    """
    here = Path(__file__).resolve()
    offenders = [
        path
        for path in [*Path("src").rglob("*.py"), *Path("tests").rglob("*.py")]
        if path.resolve() != here and "create_all(" in path.read_text(encoding="utf-8")
    ]
    assert offenders == [], f"{offenders} (PERS-004 : alembic upgrade head)"
