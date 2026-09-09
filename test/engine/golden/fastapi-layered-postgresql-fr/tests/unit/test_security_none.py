"""SECN-003 : l'absence d'authentification est explicite, pas partielle."""

from pathlib import Path

import pytest

PACKAGE = Path("src") / "pay_flow"


@pytest.mark.unit
def test_SECN_003_no_module_imports_fastapi_security() -> None:
    """Une sécurité partielle est pire qu'une absence : on la croit là."""
    offenders = [
        path
        for path in PACKAGE.rglob("*.py")
        if "fastapi.security" in path.read_text(encoding="utf-8")
    ]
    assert offenders == [], f"{offenders} — changer d'option (SECN-003)"
