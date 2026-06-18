"""Règles de l'option `security-oauth2-resource-server`."""

import inspect
from pathlib import Path

import pytest

from back_office.api import security

PACKAGE = Path("src") / "back_office"


@pytest.mark.unit
def test_SECO_003_the_token_is_never_decoded_without_verification() -> None:
    """Décoder sans vérifier accepte un jeton que n'importe qui peut forger."""
    source = inspect.getsource(security.current_claims)
    assert '"verify_signature": True' in source
    assert "issuer=settings.oidc_issuer" in source
    assert 'algorithms=["RS256"]' in source


@pytest.mark.unit
def test_SECO_004_only_the_shared_dependency_verifies_the_token() -> None:
    """Un contrôle par route est un bug par route."""
    offenders = [
        path
        for path in PACKAGE.rglob("*.py")
        if path.name != "security.py" and "jwt.decode" in path.read_text(encoding="utf-8")
    ]
    assert offenders == [], f"{offenders} (SECO-004)"


@pytest.mark.unit
def test_SECO_005_anonymous_is_401_and_missing_scope_is_403() -> None:
    """Répondre 403 à un anonyme cache si l'authentification aurait aidé."""
    assert "UnauthorizedError" in inspect.getsource(security.current_claims)
    assert "ForbiddenError" in inspect.getsource(security.require_scope)
