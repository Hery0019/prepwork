"""Translation of exceptions into RFC 9457 documents (CORE-010, CORE-011, CORE-012).

FastAPI ships nothing of the sort: its validation errors come out
as 422 in a shape of its own. This module is therefore skeleton
code, and the only place that picks a status code.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from edge_api.domain.exceptions import (
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
    """Registers the four translations. A single call, in the composition root."""

    @app.exception_handler(RequestValidationError)
    async def _validation(_request: Request, error: RequestValidationError) -> JSONResponse:
        # CORE-012 : FastAPI's default 422 would make the API speak two error dialects.
        errors = [
            {"field": ".".join(str(part) for part in issue["loc"][1:]), "message": issue["msg"]}
            for issue in error.errors()
        ]
        return _problem(
            400,
            "Validation failed",
            "One or more submitted values are invalid.",
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
        # CORE-037 : the traceback goes to the logs, never into the response.
        logger.exception("unhandled error", exc_info=error)
        return _problem(
            500,
            "Internal server error",
            "An unexpected error occurred.",
        )
