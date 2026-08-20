"""Niveau slice : l'application entière, la couche service doublée (CORE-020).

Le doublage passe par `dependency_overrides`, le point d'injection de FastAPI :
le routeur, la validation et les gestionnaires d'erreurs sont bien les vrais.
"""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from pay_flow.api.app import create_app
from pay_flow.api.dependencies import get_note_service
from pay_flow.api.settings import Settings
from pay_flow.service.note_service import NoteService
from tests.support import FakeNoteRepository


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    """Remplace la fixture du socle : même nom, dépendances doublées."""
    app = create_app(settings)
    service = NoteService(FakeNoteRepository())
    app.dependency_overrides[get_note_service] = lambda: service
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http
    app.dependency_overrides.clear()
