"""Unit level (CORE-020): no application, no database.

The repository is doubled here even when the project has a database:
that is what separates this level from the integration one.
"""

from datetime import UTC, datetime

import pytest

from edge_api.domain.exceptions import NotFoundError
from edge_api.domain.note import Note
from edge_api.repository.note_repository import NoteRepository
from edge_api.service.note_service import NoteService


class _FakeRepository(NoteRepository):
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


def _service() -> NoteService:
    return NoteService(_FakeRepository())


@pytest.mark.unit
async def test_create_valid_title_returns_the_stored_note() -> None:
    note = await _service().create("First", "Hello")

    assert note.title == "First"
    assert note.id is not None


@pytest.mark.unit
async def test_get_unknown_id_raises_not_found() -> None:
    with pytest.raises(NotFoundError):
        await _service().get(404)


@pytest.mark.unit
async def test_list_page_of_two_returns_requested_page_and_total() -> None:
    service = _service()
    for title in ("One", "Two", "Three"):
        await service.create(title, None)

    page = await service.list(page=1, size=2)

    assert [note.title for note in page.content] == ["Three"]
    assert page.total_elements == 3
