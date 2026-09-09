"""Fixtures communes aux trois niveaux (CORE-020)."""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from pay_flow.api.app import create_app
from pay_flow.api.settings import Settings


@pytest.fixture
def settings() -> Settings:
    """Réglages de test : jamais ceux du `.env` du poste."""
    return Settings(
        app_env="local",
        cors_origins=["http://localhost:5173"],
        database_url="postgresql+asyncpg://app:app@localhost:5432/app",
    )


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    """Niveau slice : l'application est appelée par `ASGITransport`, sans socket réseau."""
    app = create_app(settings)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http
