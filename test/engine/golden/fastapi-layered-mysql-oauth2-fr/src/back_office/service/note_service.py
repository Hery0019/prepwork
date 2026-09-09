"""Cas d'usage des notes. PY-004 : aucun symbole `fastapi`, `HTTPException` compris."""

from back_office.domain.exceptions import NotFoundError
from back_office.domain.note import Note
from back_office.domain.pagination import Page
from back_office.repository.note_repository import NoteRepository

MAX_PAGE_SIZE = 100


class NoteService:
    """Le dépôt est reçu en paramètre : le service se teste sans base."""

    def __init__(self, repository: NoteRepository) -> None:
        self._repository = repository

    async def create(self, title: str, body: str | None) -> Note:
        return await self._repository.add(title, body)

    async def get(self, note_id: int) -> Note:
        note = await self._repository.find(note_id)
        if note is None:
            # PY-008 : jamais `None` pour dire « introuvable » ; le gestionnaire traduit en 404.
            raise NotFoundError("Note", note_id)
        return note

    async def list(self, page: int, size: int) -> Page[Note]:
        bounded = min(max(size, 1), MAX_PAGE_SIZE)
        content, total = await self._repository.page(max(page, 0), bounded)
        return Page(content=content, page=max(page, 0), size=bounded, total_elements=total)
