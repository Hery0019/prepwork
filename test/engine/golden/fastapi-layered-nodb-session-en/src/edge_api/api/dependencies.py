"""Feature wiring: the second module of the composition root (PY-002).

`app.py` assembles the framework, this module wires the services.
It is, with it, the only place that names a repository.
"""

from fastapi import Request

from edge_api.repository.note_repository import NoteRepository
from edge_api.service.note_service import NoteService


def build_note_repository() -> NoteRepository:
    """With no database, a single repository carried by the app."""
    return NoteRepository()


async def get_note_service(request: Request) -> NoteService:
    return NoteService(request.app.state.note_repository)
