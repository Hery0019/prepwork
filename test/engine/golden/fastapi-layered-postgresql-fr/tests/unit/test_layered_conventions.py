"""Règles du profil `layered` que le contrat `import-linter` ne sait pas dire.

Le contrat borne les imports ; il ne dit rien de ce qu'un module
construit à l'import, ni du nombre de racines de composition.
"""

import ast
from pathlib import Path

import pytest

PACKAGE = Path("src") / "pay_flow"


def _module_sources() -> list[tuple[Path, str]]:
    return [(path, path.read_text(encoding="utf-8")) for path in PACKAGE.rglob("*.py")]


@pytest.mark.unit
def test_PY_002_only_the_composition_root_imports_the_repository() -> None:
    """La racine nomme le dépôt pour câbler la session ; les autres non."""
    # Trois modules forment la racine : `app.py` assemble le framework,
    # `routes.py` monte et câble, `dependencies.py` fournit. C'est le
    # pendant de `Program` et des méthodes `Add*` côté ASP.NET.
    composition_root = {"app.py", "routes.py", "dependencies.py"}
    repository = "pay_flow.repository"
    offenders = [
        path
        for path, source in _module_sources()
        if path.parent.name == "api" and path.name not in composition_root and repository in source
    ]
    assert offenders == [], f"{offenders} (PY-002)"


@pytest.mark.unit
def test_PY_006_no_module_builds_an_engine_at_import_time() -> None:
    """Un moteur construit à l'import ne peut pas être remplacé dans un test."""
    builders = {"create_async_engine", "async_sessionmaker", "sessionmaker"}
    # Le niveau module seulement : dans une fonction, construire un moteur est légitime.
    definitions = (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
    for path, source in _module_sources():
        for node in ast.parse(source).body:
            if isinstance(node, definitions):
                continue
            for called in ast.walk(node):
                if isinstance(called, ast.Call) and isinstance(called.func, ast.Name):
                    assert called.func.id not in builders, f"{path} (PY-006)"


@pytest.mark.unit
def test_PY_007_a_single_module_imports_every_layer() -> None:
    """La racine de composition est unique : un seul fichier à lire pour savoir ce qui est câblé."""
    layers = {"domain", "repository", "service", "api"}
    roots = []
    for path, source in _module_sources():
        imported = {
            alias.split(".")[-1]
            for node in ast.walk(ast.parse(source))
            if isinstance(node, ast.ImportFrom) and node.module
            for alias in [node.module]
        }
        if layers <= imported:
            roots.append(path)
    assert len(roots) <= 1, f"plusieurs racines de composition : {roots} (PY-007)"
