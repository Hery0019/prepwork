"""The only diagnostic endpoint exposed (CORE-032)."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def read_health() -> dict[str, str]:
    """Returns neither configuration, nor environment, nor dumps: that would be a leak."""
    return {"status": "up"}
