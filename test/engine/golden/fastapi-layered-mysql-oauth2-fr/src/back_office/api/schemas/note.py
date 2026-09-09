"""Schémas Pydantic des notes. CORE-013 : le routeur expose ceci, jamais l'entité."""

from datetime import datetime

from pydantic import BaseModel, Field

from back_office.domain.note import Note
from back_office.domain.pagination import Page


class CreateNoteRequest(BaseModel):
    """CORE-014 : la validation est déclarée ici, pas écrite dans le service."""

    title: str = Field(min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=10_000)


class NoteResponse(BaseModel):
    """Liste exactement les champs exposés : une nouvelle colonne ne fuit pas (CORE-AP-012)."""

    id: int
    title: str
    body: str | None
    created_at: datetime

    @classmethod
    def of(cls, note: Note) -> "NoteResponse":
        assert note.id is not None
        return cls(id=note.id, title=note.title, body=note.body, created_at=note.created_at)


class NotePage(BaseModel):
    """CORE-015 : la forme de page est la même pour tous les endpoints de liste."""

    content: list[NoteResponse]
    page: int
    size: int
    totalElements: int  # noqa: N815 — nom du contrat d'API, commun aux quatre packs.

    @classmethod
    def of(cls, page: Page[Note]) -> "NotePage":
        return cls(
            content=[NoteResponse.of(note) for note in page.content],
            page=page.page,
            size=page.size,
            totalElements=page.total_elements,
        )
