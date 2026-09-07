"""Importer le domaine peuple `Base.metadata` : Alembic voit toutes les tables."""

from pay_flow.domain.base import Base
from pay_flow.domain.note import Note

__all__ = ["Base", "Note"]
