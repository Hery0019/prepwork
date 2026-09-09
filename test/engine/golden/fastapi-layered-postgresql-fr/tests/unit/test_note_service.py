"""Niveau unitaire (CORE-020) : ni application, ni base de données.

Le dépôt est doublé ici, même quand le projet a une base : c'est ce qui
distingue ce niveau du niveau intégration.
"""

import pytest

from pay_flow.domain.exceptions import NotFoundError
from pay_flow.service.note_service import NoteService
from tests.support import FakeNoteRepository


def _service() -> NoteService:
    return NoteService(FakeNoteRepository())


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
