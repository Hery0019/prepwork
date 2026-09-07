"""Access to notes. PY-005: the only layer that builds SQLAlchemy statements."""

from datetime import UTC, datetime

from edge_api.domain.note import Note


class NoteRepository:
    """With no database, in-memory storage; the same interface as with one."""

    def __init__(self) -> None:
        self._notes: list[Note] = []
        self._next_id = 1

    async def add(self, title: str, body: str | None) -> Note:
        note = Note(title=title, body=body, created_at=datetime.now(UTC), id=self._next_id)
        self._next_id += 1
        self._notes.append(note)
        return note

    async def find(self, note_id: int) -> Note | None:
        return next((note for note in self._notes if note.id == note_id), None)

    async def page(self, page: int, size: int) -> tuple[list[Note], int]:
        start = page * size
        return self._notes[start : start + size], len(self._notes)
