"""Racine de composition : assemble le framework, puis délègue.

Deux contrats tenus par convention de nom, jamais par une
référence croisée : `configure_security` vient toujours d'une
option `security-*`, `register_routes` toujours du profil.
Aucun des deux axes ne nomme l'autre.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pay_flow.api import health
from pay_flow.api.errors import register_error_handlers
from pay_flow.api.middleware import SecurityHeadersMiddleware
from pay_flow.api.routes import register_routes
from pay_flow.api.security import configure_security
from pay_flow.api.settings import Settings, get_settings

# CORE-016 : versionné dès le premier jour ; versionner coûte peu maintenant et beaucoup après.
API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None) -> FastAPI:
    """Assemble l'application. Les tests appellent cette fonction avec leurs propres réglages."""
    resolved = settings or get_settings()
    app = FastAPI(
        title="pay-flow",
        # CORE-036 : la documentation interactive n'est pas servie en production.
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
