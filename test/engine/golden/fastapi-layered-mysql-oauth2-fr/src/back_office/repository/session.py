"""Moteur et sessions SQLAlchemy. Aucun symbole `fastapi` ici : c'est la couche dépôt."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


def create_session_factory(database_url: str) -> async_sessionmaker[AsyncSession]:
    """PERS-005 : appelé une fois au démarrage ; un moteur par requête épuiserait la base."""
    engine: AsyncEngine = create_async_engine(database_url, pool_pre_ping=True)
    # PERS-007 : le chargement paresseux lève à l'await sous asyncio ;
    # les relations se chargent explicitement.
    return async_sessionmaker(engine, expire_on_commit=False)


@asynccontextmanager
async def session_scope(
    factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    """PERS-006 : une requête est une transaction — commit au succès, rollback sur exception."""
    async with factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        else:
            await session.commit()
