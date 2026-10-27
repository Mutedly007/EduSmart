"""FastAPI routes for Formation CRUD operations."""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.formation import (
    FormationCommandRequest,
    FormationCommandResponse,
    FormationCreate,
    FormationItem,
    FormationUpdate,
)
from app.services.formation_service import formation_service

logger = logging.getLogger("edusmart.routes.formations")

router = APIRouter(prefix="/formations", tags=["Formation CRUD"])


@router.get("", response_model=List[FormationItem], summary="List Formation individuals")
async def list_formations(
    name: Optional[str] = Query(None, description="Filter by formation name"),
    class_name: Optional[str] = Query(None, description="Filter by Formation subclass"),
) -> List[FormationItem]:
    try:
        return await formation_service.get_all(name=name, class_name=class_name)
    except Exception as exc:
        logger.exception("Error retrieving Formation individuals")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des formations: {exc}",
        ) from exc


@router.get("/classes", response_model=List[dict[str, str]], summary="List Formation subclasses")
async def list_formation_classes() -> List[dict[str, str]]:
    try:
        return await formation_service.get_classes()
    except Exception as exc:
        logger.exception("Error retrieving Formation classes")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des classes Formation: {exc}",
        ) from exc


@router.post("/chat", response_model=FormationCommandResponse, summary="Execute a Formation TALN command")
async def execute_formation_command(request: FormationCommandRequest) -> FormationCommandResponse:
    try:
        return FormationCommandResponse(
            **await formation_service.execute_chat_command(request.command)
        )
    except Exception as exc:
        logger.exception("Error processing Formation command")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement de la commande Formation: {exc}",
        ) from exc


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a Formation individual")
async def create_formation(data: FormationCreate) -> dict:
    try:
        result = await formation_service.create(data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la création SPARQL",
            )
        return result
    except HTTPException:
        raise
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error creating Formation individual")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la formation: {exc}",
        ) from exc


@router.put("/{formation_id}", summary="Update a Formation individual")
async def update_formation(formation_id: str, data: FormationUpdate) -> dict:
    try:
        result = await formation_service.update(formation_id, data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la mise à jour SPARQL",
            )
        return result
    except HTTPException:
        raise
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error updating Formation individual %s", formation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modification de la formation: {exc}",
        ) from exc


@router.delete("/{formation_id}", summary="Delete a Formation individual")
async def delete_formation(formation_id: str) -> dict:
    try:
        result = await formation_service.delete(formation_id)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la suppression SPARQL",
            )
        return result
    except HTTPException:
        raise
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error deleting Formation individual %s", formation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression de la formation: {exc}",
        ) from exc
