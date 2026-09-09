"""Contexte Alembic. L'URL vient de l'environnement, jamais d'`alembic.ini` (CORE-030)."""

import asyncio
import os

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Contrat de nom : le profil fournit `Base` dans le module du rôle `kernel`, et l'importer
# peuple `metadata` avec toutes ses entités. L'option ne nomme aucune couche.
from back_office.domain import Base

target_metadata = Base.metadata


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL est requis")
    return url


def run_migrations_offline() -> None:
    context.configure(url=_database_url(), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(_database_url())
    async with engine.connect() as connection:
        await connection.run_sync(
            lambda sync_connection: context.configure(
                connection=sync_connection, target_metadata=target_metadata
            )
        )
        await connection.run_sync(lambda _: context.run_migrations())
        await connection.commit()
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
