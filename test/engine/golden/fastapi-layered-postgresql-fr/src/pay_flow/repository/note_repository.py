"""Accès aux notes. PY-005 : la seule couche qui construit des instructions SQLAlchemy."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from pay_flow.domain.note import Note


class NoteRepository:
    """PY-006 : la session est reçue en paramètre, jamais construite ici."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, title: str, body: str | None) -> Note:
        note = Note(title=title, body=body, created_at=datetime.now(UTC))
        self._session.add(note)
        await self._session.flush()
        return note

    async def find(self, note_id: int) -> Note | None:
        return await self._session.get(Note, note_id)

    async def page(self, page: int, size: int) -> tuple[list[Note], int]:
        # CORE-015 : une liste non bornée ne survit pas aux volumes de production.
        rows = await self._session.execute(
            select(Note).order_by(Note.id).offset(page * size).limit(size)
        )
        total = await self._session.scalar(select(func.count()).select_from(Note))
        return list(rows.scalars()), int(total or 0)
