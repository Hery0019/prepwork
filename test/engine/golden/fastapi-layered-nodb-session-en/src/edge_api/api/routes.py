"""Mounting of the profile's routers, called by the composition root (PY-007)."""

from fastapi import FastAPI

from edge_api.api.dependencies import build_note_repository
from edge_api.api.notes import router as notes_router


def register_routes(app: FastAPI, prefix: str) -> None:
    """A single place mounts the routers: one feature, one line."""
    app.state.note_repository = build_note_repository()
    app.include_router(notes_router, prefix=prefix)
