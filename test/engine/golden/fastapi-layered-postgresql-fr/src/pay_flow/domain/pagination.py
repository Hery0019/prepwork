"""Enveloppe de pagination commune à tous les endpoints de liste (CORE-015)."""

from dataclasses import dataclass

# Le socle place ce fichier par un rôle : il ignore les couches du profil.


@dataclass(frozen=True, slots=True)
class Page[T]:
    """Une page de résultats et son total, tels que l'API les expose."""

    content: list[T]
    page: int
    size: int
    total_elements: int
