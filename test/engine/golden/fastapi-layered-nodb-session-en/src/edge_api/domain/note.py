"""The `Note` entity: the vocabulary shared by every layer.

PY-003: this module imports neither `fastapi` nor `starlette`. It
reads and tests without starting a web application.
"""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class Note:
    """A note. With no database, the entity is a plain structure."""

    title: str
    created_at: datetime
    body: str | None = None
    id: int | None = field(default=None)
