"""Pagination envelope shared by every list endpoint (CORE-015)."""

from dataclasses import dataclass

# The core places this file by role: it knows nothing of the profile's layers.


@dataclass(frozen=True, slots=True)
class Page[T]:
    """A page of results and its total, as the API exposes them."""

    content: list[T]
    page: int
    size: int
    total_elements: int
