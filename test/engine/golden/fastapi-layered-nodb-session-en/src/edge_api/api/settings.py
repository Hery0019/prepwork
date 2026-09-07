"""Typed settings read from the environment (CORE-030).

A field with no default fails startup when the variable is missing,
rather than the first request that needs it.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Everything that differs from one environment to the next, and nothing else."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["local", "staging", "production"] = "local"
    # CORE-033 : an explicit list, never `*` outside local development.
    cors_origins: list[str] = []
    session_secret: str
    session_cookie_name: str

    @property
    def docs_enabled(self) -> bool:
        """CORE-036 : `/docs` publishes every route and every field to anyone who asks."""
        return self.app_env != "production"


@lru_cache
def get_settings() -> Settings:
    """One instance per process; tests pass their own to `create_app`."""
    # The values come from the environment: mypy does not know that, pydantic-settings does.
    return Settings()  # type: ignore[call-arg]
