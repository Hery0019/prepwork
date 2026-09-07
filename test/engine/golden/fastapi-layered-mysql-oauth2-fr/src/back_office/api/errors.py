"""Traduction des exceptions en documents RFC 9457 (CORE-010, CORE-011, CORE-012).

FastAPI ne fournit rien de tel : ses erreurs de validation sortent
en 422 sous une forme qui lui est propre. Ce module est donc du
code de squelette, et le seul endroit qui choisit un statut.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from back_office.domain.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
)

PROBLEM_MEDIA_TYPE = "application/problem+json"

logger = logging.getLogger(__name__)


def _problem(status: int, title: str, detail: str, **extra: Any) -> JSONResponse:
    body: dict[str, Any] = {
        "type": "about:blank",
        "title": title,
        "status": status,
        "detail": detail,
    }
    body.update(extra)
    return JSONResponse(status_code=status, content=body, media_type=PROBLEM_MEDIA_TYPE)


def register_error_handlers(app: FastAPI) -> None:
    """Enregistre les quatre traductions. Un seul appel, dans la racine de composition."""

    @app.exception_handler(RequestValidationError)
    async def _validation(_request: Request, error: RequestValidationError) -> JSONResponse:
        # CORE-012 : le 422 par défaut de FastAPI ferait parler deux dialectes d'erreur à l'API.
        errors = [
            {"field": ".".join(str(part) for part in issue["loc"][1:]), "message": issue["msg"]}
            for issue in error.errors()
        ]
        return _problem(
            400,
            "Validation failed",
            "Une ou plusieurs valeurs envoyées sont invalides.",
            errors=errors,
        )

    @app.exception_handler(NotFoundError)
    async def _not_found(_request: Request, error: NotFoundError) -> JSONResponse:
        return _problem(404, "Not found", str(error))

    @app.exception_handler(ConflictError)
    async def _conflict(_request: Request, error: ConflictError) -> JSONResponse:
        return _problem(409, "Conflict", str(error))

    @app.exception_handler(UnauthorizedError)
    async def _unauthorized(_request: Request, error: UnauthorizedError) -> JSONResponse:
        return _problem(401, "Unauthorized", str(error))

    @app.exception_handler(ForbiddenError)
    async def _forbidden(_request: Request, error: ForbiddenError) -> JSONResponse:
        return _problem(403, "Forbidden", str(error))

    @app.exception_handler(Exception)
    async def _unexpected(_request: Request, error: Exception) -> JSONResponse:
        # CORE-037 : le traceback va dans les logs, jamais dans la réponse.
        logger.exception("unhandled error", exc_info=error)
        return _problem(
            500,
            "Internal server error",
            "Une erreur inattendue est survenue.",
        )
