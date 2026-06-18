"""Niveau intégration : le vrai moteur de base, jamais SQLite (CORE-021).

Le schéma est monté par `alembic upgrade head`, jamais par `create_all` (PERS-004) :
les migrations sont ainsi testées à chaque exécution de la suite.
"""

import os
from collections.abc import AsyncIterator, Iterator

import pytest
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from testcontainers.postgres import PostgresContainer

from pay_flow.api.app import create_app
from pay_flow.api.settings import Settings


@pytest.fixture(scope="session")
def database_url() -> Iterator[str]:
    """Un conteneur pour toute la session : le démarrage coûte plus cher que les tests."""
    with PostgresContainer("postgres:17-alpine") as container:
        url = container.get_connection_url().replace(
            container.get_connection_url().split("://")[0], "postgresql+asyncpg", 1
        )
        os.environ["DATABASE_URL"] = url
        config = Config("alembic.ini")
        command.upgrade(config, "head")
        yield url


@pytest.fixture
async def api(database_url: str) -> AsyncIterator[AsyncClient]:
    # `it.env` porte les variables de toutes les options : ce fichier n'en nomme aucune.
    app = create_app(
        Settings(
            app_env="local",
            database_url=database_url,
        )
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http
