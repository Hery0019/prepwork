"""Composition root: assembles the framework, then delegates.

Two contracts held by naming convention, never by a
cross-reference: `configure_security` always comes from a
`security-*` option, `register_routes` always from the profile.
Neither of the two axes names the other.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from edge_api.api import health
from edge_api.api.errors import register_error_handlers
from edge_api.api.middleware import SecurityHeadersMiddleware
from edge_api.api.routes import register_routes
from edge_api.api.security import configure_security
from edge_api.api.settings import Settings, get_settings

# CORE-016 : versioned from day one; versioning is cheap now and expensive later.
API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None) -> FastAPI:
    """Assembles the application. Tests call this function with their own settings."""
    resolved = settings or get_settings()
    app = FastAPI(
        title="edge-api",
        # CORE-036 : the interactive documentation is not served in production.
        docs_url="/docs" if resolved.docs_enabled else None,
        openapi_url="/openapi.json" if resolved.docs_enabled else None,
    )
    app.state.settings = resolved

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    configure_security(app)
    register_error_handlers(app)
    app.include_router(health.router, prefix=API_PREFIX)
    register_routes(app, API_PREFIX)
    return app
