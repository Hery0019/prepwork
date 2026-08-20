"""Doubles partagés par les niveaux unitaire et slice.

Le dépôt est doublé dans les deux niveaux, quelle que soit la base du projet :
c'est ce qui les sépare du niveau intégration (CORE-020).
"""

from datetime import UTC, datetime

from pay_flow.domain.note import Note
from pay_flow.repository.note_repository import NoteRepository


class FakeNoteRepository(NoteRepository):
    """Même surface que le vrai dépôt, sans session ni base."""

    def __init__(self) -> None:
        self._notes: list[Note] = []
        self._next_id = 1

    async def add(self, title: str, body: str | None) -> Note:
        note = Note(title=title, body=body, created_at=datetime.now(UTC))
        note.id = self._next_id
        self._next_id += 1
        self._notes.append(note)
        return note

    async def find(self, note_id: int) -> Note | None:
        return next((note for note in self._notes if note.id == note_id), None)

    async def page(self, page: int, size: int) -> tuple[list[Note], int]:
        start = page * size
        return self._notes[start : start + size], len(self._notes)
