"""FastAPI router for Personnes CRUD and natural language chat commands."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.personne import (
    PersonneCreate,
    PersonneItem,
    PersonneUpdate,
    PersonneCommandRequest,
    PersonneCommandResponse,
)
from app.services.personnes_service import personnes_service

logger = logging.getLogger("edusmart.routes.personnes")

router = APIRouter(prefix="/personnes", tags=["Personnes CRUD & TALN"])


@router.get("", response_model=List[PersonneItem], summary="Get all individuals under Personnes")
async def list_personnes(
    name: Optional[str] = Query(None, description="Filter by name / label substring"),
    class_name: Optional[str] = Query(None, description="Filter by subclass (e.g. Enseignant, Etudiant)"),
):
    """List all individuals belonging to the Personnes root branch or its subclasses."""
    try:
        return await personnes_service.get_all(name=name, class_name=class_name)
    except Exception as e:
        logger.error("Error retrieving Personnes individuals: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des personnes: {str(e)}",
        )


@router.get("/classes", response_model=List[Dict[str, str]], summary="Get all subclasses of Personnes")
async def list_personne_classes():
    """List all subclasses under Personnes for filtering and creation dropdowns."""
    try:
        return await personnes_service.get_classes()
    except Exception as e:
        logger.error("Error retrieving Personnes classes: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des classes: {str(e)}",
        )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new Personne individual")
async def create_personne(data: PersonneCreate):
    """Create a new person individual in Apache Jena Fuseki via SPARQL 1.1 INSERT DATA."""
    try:
        result = await personnes_service.create(data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de l'insertion SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating person: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la personne: {str(e)}",
        )


@router.put("/{person_id}", summary="Update a Personne individual")
async def update_personne(person_id: str, data: PersonneUpdate):
    """Update a person individual in Apache Jena Fuseki via SPARQL 1.1 DELETE/INSERT."""
    try:
        result = await personnes_service.update(person_id, data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la mise à jour SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating person %s: %s", person_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modification de la personne: {str(e)}",
        )


@router.delete("/{person_id}", summary="Delete a Personne individual")
async def delete_personne(person_id: str):
    """Delete a person individual and all connected triples via SPARQL 1.1 DELETE WHERE."""
    try:
        result = await personnes_service.delete(person_id)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la suppression SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting person %s: %s", person_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression de la personne: {str(e)}",
        )


@router.post("/chat", response_model=PersonneCommandResponse, summary="Execute natural language command for Personnes")
async def execute_personne_chat(req: PersonneCommandRequest):
    """Execute natural language CRUD commands (e.g. 'créer un étudiant nommé Yassine Ben Ali')."""
    try:
        res = await personnes_service.execute_chat_command(req.command)
        return res
    except Exception as e:
        logger.error("Error processing chat command '%s': %s", req.command, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement de la commande TALN: {str(e)}",
        )
