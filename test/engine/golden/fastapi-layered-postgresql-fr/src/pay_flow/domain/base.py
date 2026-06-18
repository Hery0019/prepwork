"""Base déclarative du modèle.

Contrat de nom entre le profil et l'option de persistance : celle-ci importe
`Base` depuis le module du rôle `kernel`, sans jamais nommer une couche.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Alembic lit ses métadonnées pour comparer le modèle au schéma (PERS-001)."""
