"""Aucune authentification (SECN-001).

Cette version ne fait rien, et c'est le point : la racine de
composition appelle toujours `configure_security`, quelle que
soit l'option. Aucun des deux axes ne nomme l'autre.
"""

from fastapi import FastAPI


def configure_security(app: FastAPI) -> None:
    """Rien à configurer (SECN-002 avant toute exposition publique)."""
    return None
