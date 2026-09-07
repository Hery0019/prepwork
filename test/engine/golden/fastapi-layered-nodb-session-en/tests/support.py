"""Doubles shared by the unit and slice levels.

The repository is doubled at both levels, whatever the project database:
that is what separates them from the integration level (CORE-020).
"""

from datetime import UTC, datetime

from edge_api.domain.note import Note
from edge_api.repository.note_repository import NoteRepository


class FakeNoteRepository(NoteRepository):
    """The same surface as the real repository, with no session and no database."""

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
