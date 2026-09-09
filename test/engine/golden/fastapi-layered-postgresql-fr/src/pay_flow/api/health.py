"""Le seul endpoint de diagnostic exposé (CORE-032)."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def read_health() -> dict[str, str]:
    """Ne renvoie ni configuration, ni environnement, ni dump : ce serait une fuite."""
    return {"status": "up"}
