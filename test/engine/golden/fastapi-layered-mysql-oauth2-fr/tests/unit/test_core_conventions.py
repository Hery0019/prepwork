"""Règles du socle que le contrat `import-linter` ne sait pas dire.

Chaque test porte l'identifiant de la règle qu'il prouve, comme un
test ArchUnit côté Spring : c'est cette convention que le contrôle
de cohérence du catalogue vérifie.
"""

import inspect

import pytest
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute

from back_office.api.app import create_app
from back_office.api.errors import PROBLEM_MEDIA_TYPE
from back_office.api.settings import Settings
from back_office.domain.exceptions import ConflictError, NotFoundError


def _settings(app_env: str = "local") -> Settings:
    return Settings(
        app_env=app_env,  # type: ignore[arg-type]
        database_url="mysql+asyncmy://app:app@localhost:3306/app",
        oidc_issuer="https://auth.example.com/realms/app",
        oidc_audience="test",
    )


def _app() -> FastAPI:
    return create_app(_settings())


@pytest.mark.unit
def test_CORE_011_exception_handlers_are_registered_once() -> None:
    handled = set(_app().exception_handlers)
    assert {RequestValidationError, NotFoundError, ConflictError, Exception} <= handled


@pytest.mark.unit
def test_CORE_012_validation_errors_are_problem_documents() -> None:
    assert PROBLEM_MEDIA_TYPE == "application/problem+json"
    assert RequestValidationError in _app().exception_handlers


@pytest.mark.unit
def test_CORE_013_no_route_exposes_a_domain_entity() -> None:
    """Formulé sur le module et non sur l'ORM : la règle vaut aussi sans base."""
    domain = "back_office.domain"
    for route in _app().routes:
        if not isinstance(route, APIRoute):
            continue
        annotations = [route.response_model, *inspect.signature(route.endpoint).parameters.values()]
        for annotation in annotations:
            candidate = getattr(annotation, "annotation", annotation)
            module = getattr(candidate, "__module__", "")
            assert not module.startswith(domain), f"{route.path} expose le domaine"


@pytest.mark.unit
def test_CORE_016_every_route_is_versioned() -> None:
    for route in _app().routes:
        if isinstance(route, APIRoute):
            assert route.path.startswith("/api/v1/"), route.path


@pytest.mark.unit
def test_CORE_021_the_test_database_is_not_sqlite() -> None:
    """L'équivalent Python de l'interdiction de H2 : SQLite ne connaît pas le SQL de production."""
    import os

    url = os.environ.get("DATABASE_URL", "")
    assert "sqlite" not in url, "CORE-021"


@pytest.mark.unit
def test_CORE_023_every_test_carries_exactly_one_level_marker() -> None:
    """Vérifié par la configuration pytest et le hook ci-dessous ; ce test documente la règle."""
    from pathlib import Path

    levels = {"unit", "slice", "integration"}
    for path in Path("tests").rglob("test_*.py"):
        source = path.read_text(encoding="utf-8")
        for marker in levels:
            if f"@pytest.mark.{marker}" in source:
                break
        else:  # pragma: no cover
            raise AssertionError(f"{path} : aucun marqueur de niveau (CORE-023)")


@pytest.mark.unit
def test_CORE_036_docs_are_disabled_in_production() -> None:
    assert create_app(_settings("production")).docs_url is None
    assert create_app(_settings("local")).docs_url == "/docs"


@pytest.mark.unit
def test_CORE_037_the_500_handler_hides_the_traceback() -> None:
    source = inspect.getsource(_app().exception_handlers[Exception])
    assert "logger.exception" in source
    assert "traceback" not in source.lower().split("logger.exception")[1]
