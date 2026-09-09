"""Notes router. CORE-013: it takes and returns schemas, never the entity."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from edge_api.api.dependencies import get_note_service
from edge_api.api.schemas.note import CreateNoteRequest, NotePage, NoteResponse
from edge_api.service.note_service import NoteService

router = APIRouter(prefix="/notes", tags=["notes"])

ServiceDep = Annotated[NoteService, Depends(get_note_service)]


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(request: CreateNoteRequest, service: ServiceDep) -> NoteResponse:
    return NoteResponse.of(await service.create(request.title, request.body))


@router.get("/{note_id}", response_model=NoteResponse)
async def read_note(note_id: int, service: ServiceDep) -> NoteResponse:
    # No try/except here: the domain exception propagates to the single handler (CORE-AP-011).
    return NoteResponse.of(await service.get(note_id))


@router.get("", response_model=NotePage)
async def list_notes(
    service: ServiceDep,
    page: Annotated[int, Query(ge=0)] = 0,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> NotePage:
    return NotePage.of(await service.list(page, size))
