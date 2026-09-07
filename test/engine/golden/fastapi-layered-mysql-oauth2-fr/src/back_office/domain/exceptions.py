"""Exceptions du domaine, traduites en réponses par le gestionnaire unique (CORE-011)."""


class DomainError(Exception):
    """Racine des erreurs métier. Aucune ne connaît de code de statut HTTP (PY-004)."""


class NotFoundError(DomainError):
    """Ressource demandée absente : le gestionnaire répond 404."""

    def __init__(self, resource: str, identifier: object) -> None:
        super().__init__(f"{resource} {identifier!r} not found")
        self.resource = resource
        self.identifier = identifier


class ConflictError(DomainError):
    """État incompatible avec l'opération demandée : le gestionnaire répond 409."""


class UnauthorizedError(DomainError):
    """Appelant non authentifié : le gestionnaire répond 401.

    Définie ici, et non dans l'option de sécurité, pour que CORE-011 reste vrai :
    un seul module enregistre les traductions d'exception.
    """


class ForbiddenError(DomainError):
    """Authentifié mais sans le droit demandé : le gestionnaire répond 403."""
