"""FastAPI router for Compétences CRUD and natural language chat commands."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.competence import (
    CompetenceClassItem,
    CompetenceCommandRequest,
    CompetenceCommandResponse,
    CompetenceCreate,
    CompetenceItem,
    CompetenceUpdate,
)
from app.services.competences_service import competences_service

logger = logging.getLogger("edusmart.routes.competences")

router = APIRouter(prefix="/competences", tags=["Compétences CRUD & TALN"])


@router.get("", response_model=List[CompetenceItem], summary="Get all individuals under Compétence")
async def list_competences(
    name: Optional[str] = Query(None, description="Filter by title / label substring"),
    class_name: Optional[str] = Query(None, description="Filter by subclass (e.g. Programmation, SQL)"),
    niveau: Optional[str] = Query(None, description="Filter by level (Débutant, Intermédiaire, Avancé, Expert)"),
    category: Optional[str] = Query(None, description="Filter by category (Technique, Transversale, Linguistique)"),
):
    """List all competence individuals belonging to the Compétence branch or its subclasses."""
    try:
        return await competences_service.get_all(
            name=name,
            class_name=class_name,
            niveau=niveau,
            category=category,
        )
    except Exception as e:
        logger.error("Error retrieving Compétences individuals: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des compétences: {str(e)}",
        )


@router.get("/classes", response_model=List[CompetenceClassItem], summary="Get all subclasses of Compétence")
async def list_competence_classes():
    """List all subclasses under Compétence for filtering and creation dropdowns."""
    try:
        return await competences_service.get_classes()
    except Exception as e:
        logger.error("Error retrieving Compétence classes: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des classes de compétences: {str(e)}",
        )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new Compétence individual")
async def create_competence(data: CompetenceCreate):
    """Create a new competence individual in Apache Jena Fuseki via SPARQL 1.1 INSERT DATA."""
    try:
        result = await competences_service.create(data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de l'insertion SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating competence: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la compétence: {str(e)}",
        )


@router.put("/{competence_id}", summary="Update a Compétence individual")
async def update_competence(competence_id: str, data: CompetenceUpdate):
    """Update a competence individual in Apache Jena Fuseki via SPARQL 1.1 DELETE/INSERT."""
    try:
        result = await competences_service.update(competence_id, data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la mise à jour SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating competence %s: %s", competence_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modification de la compétence: {str(e)}",
        )


@router.delete("/{competence_id}", summary="Delete a Compétence individual")
async def delete_competence(competence_id: str):
    """Delete a competence individual and all connected triples via SPARQL 1.1 DELETE WHERE."""
    try:
        result = await competences_service.delete(competence_id)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la suppression SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting competence %s: %s", competence_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression de la compétence: {str(e)}",
        )


@router.post("/chat", response_model=CompetenceCommandResponse, summary="Execute natural language command for Compétences")
async def execute_competence_chat(req: CompetenceCommandRequest):
    """Execute natural language CRUD commands (e.g. 'créer une compétence nommée Machine Learning de niveau Avancé')."""
    try:
        res = await competences_service.execute_chat_command(req.command)
        return res
    except Exception as e:
        logger.error("Error processing chat command '%s': %s", req.command, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement de la commande TALN: {str(e)}",
        )
