"""Niveau unitaire (CORE-020) : ni application, ni base de données.

Le dépôt est doublé ici, même quand le projet a une base : c'est ce qui
distingue ce niveau du niveau intégration.
"""

from datetime import UTC, datetime

import pytest

from back_office.domain.exceptions import NotFoundError
from back_office.domain.note import Note
from back_office.repository.note_repository import NoteRepository
from back_office.service.note_service import NoteService


class _FakeRepository(NoteRepository):
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
