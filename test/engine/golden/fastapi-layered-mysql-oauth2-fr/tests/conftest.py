"""Fixtures communes aux trois niveaux (CORE-020)."""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from back_office.api.app import create_app
from back_office.api.settings import Settings


@pytest.fixture
def settings() -> Settings:
    """Réglages de test : jamais ceux du `.env` du poste."""
    return Settings(
        app_env="local",
        cors_origins=["http://localhost:5173"],
        database_url="mysql+asyncmy://app:app@localhost:3306/app",
        oidc_issuer="https://auth.example.com/realms/app",
        oidc_audience="test",
    )


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    """Niveau slice : l'application est appelée par `ASGITransport`, sans socket réseau."""
    app = create_app(settings)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http
