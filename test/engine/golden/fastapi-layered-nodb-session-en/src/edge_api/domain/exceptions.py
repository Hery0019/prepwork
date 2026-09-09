"""Domain exceptions, translated into responses by the single handler (CORE-011)."""


class DomainError(Exception):
    """Root of the business errors. None of them knows an HTTP status code (PY-004)."""


class NotFoundError(DomainError):
    """Requested resource is missing: the handler answers 404."""

    def __init__(self, resource: str, identifier: object) -> None:
        super().__init__(f"{resource} {identifier!r} not found")
        self.resource = resource
        self.identifier = identifier


class ConflictError(DomainError):
    """State incompatible with the requested operation: the handler answers 409."""


class UnauthorizedError(DomainError):
    """Unauthenticated caller: the handler answers 401.

    Defined here, not in the security option, so that CORE-011 stays true:
    a single module registers the exception translations.
    """


class ForbiddenError(DomainError):
    """Authenticated but lacking the required right: the handler answers 403."""
