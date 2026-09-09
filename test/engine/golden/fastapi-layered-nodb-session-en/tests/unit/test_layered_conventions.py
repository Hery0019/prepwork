"""Rules of the `layered` profile that the `import-linter` contract cannot express.

The contract bounds imports; it says nothing about what a module
builds at import time, nor about how many composition roots exist.
"""

import ast
from pathlib import Path

import pytest

PACKAGE = Path("src") / "edge_api"


def _module_sources() -> list[tuple[Path, str]]:
    return [(path, path.read_text(encoding="utf-8")) for path in PACKAGE.rglob("*.py")]


@pytest.mark.unit
def test_PY_002_only_the_composition_root_imports_the_repository() -> None:
    """The root names the repository to wire the session; the others do not."""
    # Three modules form the root: `app.py` assembles the framework,
    # `routes.py` mounts and wires, `dependencies.py` supplies. It is the
    # counterpart of `Program` and the `Add*` methods on the ASP.NET side.
    composition_root = {"app.py", "routes.py", "dependencies.py"}
    repository = "edge_api.repository"
    offenders = [
        path
        for path, source in _module_sources()
        if path.parent.name == "api" and path.name not in composition_root and repository in source
    ]
    assert offenders == [], f"{offenders} (PY-002)"


@pytest.mark.unit
def test_PY_006_no_module_builds_an_engine_at_import_time() -> None:
    """An engine built at import time cannot be replaced in a test."""
    builders = {"create_async_engine", "async_sessionmaker", "sessionmaker"}
    # Module level only: inside a function, building an engine is legitimate.
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
    """The composition root is unique: a single file to read to know what is wired."""
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
