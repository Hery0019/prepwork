"""Réglages typés lus depuis l'environnement (CORE-030).

Un champ sans défaut fait échouer le démarrage quand la variable manque,
plutôt que la première requête qui en a besoin.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Tout ce qui diffère d'un environnement à l'autre, et rien d'autre."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["local", "staging", "production"] = "local"
    # CORE-033 : liste explicite, jamais `*` hors développement local.
    cors_origins: list[str] = []
    database_url: str
    oidc_issuer: str
    oidc_audience: str

    @property
    def docs_enabled(self) -> bool:
        """CORE-036 : `/docs` publie chaque route et chaque champ à qui le demande."""
        return self.app_env != "production"


@lru_cache
def get_settings() -> Settings:
    """Une seule instance par processus ; les tests passent la leur à `create_app`."""
    # Les valeurs viennent de l'environnement : mypy ne le sait pas, pydantic-settings si.
    return Settings()  # type: ignore[call-arg]
