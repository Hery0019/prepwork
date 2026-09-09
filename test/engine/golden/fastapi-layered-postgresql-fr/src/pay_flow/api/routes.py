"""Montage des routeurs du profil, appelé par la racine de composition (PY-007)."""

from fastapi import FastAPI

from pay_flow.api.notes import router as notes_router
from pay_flow.repository.session import (
    create_session_factory,
)


def register_routes(app: FastAPI, prefix: str) -> None:
    """Un seul endroit monte les routeurs : une fonctionnalité, une ligne."""
    # PERS-005 : moteur et fabrique de sessions créés une fois, au démarrage.
    app.state.session_factory = create_session_factory(app.state.settings.database_url)
    app.include_router(notes_router, prefix=prefix)
