"""Slice level: the whole application, the service layer doubled (CORE-020).

The double goes through `dependency_overrides`, FastAPI's injection point:
the router, the validation and the error handlers are the real ones.
"""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from edge_api.api.app import create_app
from edge_api.api.dependencies import get_note_service
from edge_api.api.settings import Settings
from edge_api.service.note_service import NoteService
from tests.support import FakeNoteRepository


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    """Replaces the core fixture: the same name, with doubled dependencies."""
    app = create_app(settings)
    service = NoteService(FakeNoteRepository())
    app.dependency_overrides[get_note_service] = lambda: service
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http
    app.dependency_overrides.clear()
