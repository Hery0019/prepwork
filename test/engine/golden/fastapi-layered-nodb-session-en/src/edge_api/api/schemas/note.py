"""Pydantic schemas for notes. CORE-013: the router exposes these, never the entity."""

from datetime import datetime

from pydantic import BaseModel, Field

from edge_api.domain.note import Note
from edge_api.domain.pagination import Page


class CreateNoteRequest(BaseModel):
    """CORE-014 : validation is declared here, not written in the service."""

    title: str = Field(min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=10_000)


class NoteResponse(BaseModel):
    """Lists exactly the exposed fields: a new column does not leak (CORE-AP-012)."""

    id: int
    title: str
    body: str | None
    created_at: datetime

    @classmethod
    def of(cls, note: Note) -> "NoteResponse":
        assert note.id is not None
        return cls(id=note.id, title=note.title, body=note.body, created_at=note.created_at)


class NotePage(BaseModel):
    """CORE-015 : the page shape is the same for every list endpoint."""

    content: list[NoteResponse]
    page: int
    size: int
    totalElements: int  # noqa: N815 — API contract name, shared by the four packs.

    @classmethod
    def of(cls, page: Page[Note]) -> "NotePage":
        return cls(
            content=[NoteResponse.of(note) for note in page.content],
            page=page.page,
            size=page.size,
            totalElements=page.total_elements,
        )
