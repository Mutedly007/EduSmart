"""FastAPI router for Apprentissage CRUD and natural language chat commands."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.apprentissage import (
    ApprentissageClassItem,
    ApprentissageCommandRequest,
    ApprentissageCommandResponse,
    ApprentissageCreate,
    ApprentissageItem,
    ApprentissageUpdate,
)
from app.services.apprentissage_service import apprentissage_service

logger = logging.getLogger("edusmart.routes.apprentissage")

router = APIRouter(prefix="/apprentissage", tags=["Apprentissage CRUD & TALN"])


@router.get("", response_model=List[ApprentissageItem], summary="Get all individuals under Apprentissage")
async def list_apprentissages(
    name: Optional[str] = Query(None, description="Filter by name / label substring"),
    class_name: Optional[str] = Query(None, description="Filter by subclass (e.g. Examen, TP_Guidé)"),
    category: Optional[str] = Query(None, description="Filter by category (Évaluation, Activité, Parcours, Type)"),
    modalite: Optional[str] = Query(None, description="Filter by modality (Présentiel, En ligne, Hybride)"),
):
    """List all individuals belonging to the Apprentissage branch or its subclasses."""
    try:
        return await apprentissage_service.get_all(
            name=name, class_name=class_name, category=category, modalite=modalite
        )
    except Exception as e:
        logger.error("Error retrieving Apprentissage individuals: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des activités d'apprentissage: {str(e)}",
        )


@router.get("/classes", response_model=List[ApprentissageClassItem], summary="Get all subclasses of Apprentissage")
async def list_apprentissage_classes():
    """List all subclasses under Apprentissage for filtering and creation dropdowns."""
    try:
        return await apprentissage_service.get_classes()
    except Exception as e:
        logger.error("Error retrieving Apprentissage classes: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des classes d'apprentissage: {str(e)}",
        )


@router.get("/{item_id}", response_model=ApprentissageItem, summary="Get an Apprentissage individual by ID")
async def get_apprentissage(item_id: str):
    """Retrieve details of a single Apprentissage individual."""
    item = await apprentissage_service.get_by_id(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Élément d'apprentissage '{item_id}' non trouvé.",
        )
    return item


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new Apprentissage individual")
async def create_apprentissage(data: ApprentissageCreate):
    """Create a new individual in Apache Jena Fuseki via SPARQL 1.1 INSERT DATA."""
    try:
        result = await apprentissage_service.create(data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de l'insertion SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating apprentissage: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de l'apprentissage: {str(e)}",
        )


@router.put("/{item_id}", summary="Update an Apprentissage individual")
async def update_apprentissage(item_id: str, data: ApprentissageUpdate):
    """Update an individual in Apache Jena Fuseki via SPARQL 1.1 DELETE/INSERT."""
    try:
        result = await apprentissage_service.update(item_id, data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la mise à jour SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating apprentissage %s: %s", item_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour de l'apprentissage: {str(e)}",
        )


@router.delete("/{item_id}", summary="Delete an Apprentissage individual")
async def delete_apprentissage(item_id: str):
    """Delete an individual from Apache Jena Fuseki via SPARQL 1.1 DELETE WHERE."""
    try:
        result = await apprentissage_service.delete(item_id)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la suppression SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting apprentissage %s: %s", item_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression de l'apprentissage: {str(e)}",
        )


@router.post("/chat", response_model=ApprentissageCommandResponse, summary="Execute TALN / NLP command")
async def execute_chat_command(req: ApprentissageCommandRequest):
    """Interpret a natural language command and execute the corresponding SPARQL 1.1 action."""
    try:
        result = await apprentissage_service.execute_command(req.command)
        return ApprentissageCommandResponse(**result)
    except Exception as e:
        logger.error("Error executing Apprentissage TALN command '%s': %s", req.command, e)
        return ApprentissageCommandResponse(
            success=False,
            action="error",
            message=f"Erreur interne lors de l'exécution: {str(e)}",
        )
