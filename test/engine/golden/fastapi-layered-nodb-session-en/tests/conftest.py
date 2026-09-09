"""Fixtures shared by the three levels (CORE-020)."""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from edge_api.api.app import create_app
from edge_api.api.settings import Settings


@pytest.fixture
def settings() -> Settings:
    """Test settings: never the ones from the machine's `.env`."""
    return Settings(
        app_env="local",
        cors_origins=["http://localhost:5173"],
        session_secret="test",
        session_cookie_name="app_session",
    )


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    """Slice level: the application is called through `ASGITransport`, with no network socket."""
    app = create_app(settings)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http
