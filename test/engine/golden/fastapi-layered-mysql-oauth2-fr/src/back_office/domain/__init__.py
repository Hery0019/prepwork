"""Importer le domaine peuple `Base.metadata` : Alembic voit toutes les tables."""

from back_office.domain.base import Base
from back_office.domain.note import Note

__all__ = ["Base", "Note"]
