"""Câblage des fonctionnalités : le second module de la racine de composition (PY-002).

`app.py` assemble le framework, ce module câble les services.
C'est, avec lui, le seul endroit qui nomme un dépôt.
"""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from pay_flow.repository.note_repository import NoteRepository
from pay_flow.repository.session import session_scope
from pay_flow.service.note_service import NoteService


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """PERS-006 : une requête est une transaction — commit au succès, rollback sur exception."""
    async with session_scope(request.app.state.session_factory) as session:
        yield session


async def get_note_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> NoteService:
    return NoteService(NoteRepository(session))
