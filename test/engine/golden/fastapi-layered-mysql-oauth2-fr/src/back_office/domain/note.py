"""L'entité `Note` : le vocabulaire partagé par toutes les couches.

PY-003 : ce module n'importe ni `fastapi` ni `starlette`. Il se lit
et se teste sans démarrer d'application web.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from back_office.domain.base import Base


class Note(Base):
    """Une note. Le mapping vit ici : c'est du domaine, pas de l'infrastructure."""

    __tablename__ = "note"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
