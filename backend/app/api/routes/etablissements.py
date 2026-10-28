"""FastAPI router for Établissements CRUD, Semantic Hub, and TALN chat commands."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Response, status

from app.schemas.etablissement import (
    EtablissementClassItem,
    EtablissementCommandRequest,
    EtablissementCommandResponse,
    EtablissementCreate,
    EtablissementItem,
    EtablissementUpdate,
    EtablissementAddStudent,
)
from app.services.etablissement_service import etablissement_service

logger = logging.getLogger("edusmart.routes.etablissements")

router = APIRouter(prefix="/etablissements", tags=["Établissements CRUD & TALN"])


@router.get("", response_model=List[EtablissementItem], summary="Get all establishment individuals")
async def list_etablissements(
    name: Optional[str] = Query(None, description="Filter by establishment name / substring"),
    class_name: Optional[str] = Query(None, description="Filter by subclass (e.g. Universite_Privee, Universite_Publique, Ecole)"),
    ville: Optional[str] = Query(None, description="Filter by city (e.g. Ariana, Tunis, Sousse)"),
    statut: Optional[str] = Query(None, description="Filter by status (e.g. Accrédité, Privé, Public, Actif)"),
):
    """List all establishments with their Inter-Branch Semantic Hub connections (Formations, Programmes, Étudiants)."""
    try:
        return await etablissement_service.get_all(
            name=name,
            class_name=class_name,
            ville=ville,
            statut=statut,
        )
    except Exception as e:
        logger.error("Error retrieving establishments: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des établissements: {str(e)}",
        )


@router.get("/classes", response_model=List[EtablissementClassItem], summary="Get all subclasses under Établissement")
async def list_etablissement_classes():
    """List all subclasses under Établissement for filtering and creation dropdowns."""
    try:
        return await etablissement_service.get_classes()
    except Exception as e:
        logger.error("Error retrieving establishment classes: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des types d'établissements: {str(e)}",
        )


@router.get("/{establishment_id}", response_model=EtablissementItem, summary="Get details of a single establishment")
async def get_etablissement(establishment_id: str):
    """Fetch a single establishment by its ID along with full semantic relations."""
    try:
        items = await etablissement_service.get_all(name=establishment_id)
        if not items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Établissement '{establishment_id}' introuvable.",
            )
        return items[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error retrieving establishment %s: %s", establishment_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de l'établissement: {str(e)}",
        )


@router.get("/{establishment_id}/turtle", summary="Export establishment RDF in W3C Turtle format")
async def export_etablissement_turtle(establishment_id: str):
    """Generate and return RDF Turtle serialization for the given establishment."""
    try:
        turtle_text = await etablissement_service.export_turtle(establishment_id)
        return Response(content=turtle_text, media_type="text/turtle")
    except Exception as e:
        logger.error("Error exporting turtle for %s: %s", establishment_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'export Turtle: {str(e)}",
        )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new Établissement individual")
async def create_etablissement(data: EtablissementCreate):
    """Create a new establishment in Apache Jena Fuseki via SPARQL 1.1 INSERT DATA."""
    try:
        result = await etablissement_service.create(data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de l'insertion SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating establishment: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de l'établissement: {str(e)}",
        )


@router.put("/{establishment_id}", summary="Update an existing Établissement")
async def update_etablissement(establishment_id: str, data: EtablissementUpdate):
    """Update an establishment in Apache Jena Fuseki via SPARQL 1.1 DELETE / INSERT."""
    try:
        result = await etablissement_service.update(establishment_id, data)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la modification SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating establishment %s: %s", establishment_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modification de l'établissement: {str(e)}",
        )


@router.delete("/{establishment_id}", summary="Delete an Établissement")
async def delete_etablissement(establishment_id: str):
    """Delete an establishment and its connected triples in Fuseki via SPARQL 1.1 DELETE WHERE."""
    try:
        result = await etablissement_service.delete(establishment_id)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec de la suppression SPARQL",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting establishment %s: %s", establishment_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression de l'établissement: {str(e)}",
        )


@router.post("/{establishment_id}/students", summary="Enroll an existing student to an establishment")
async def add_student_to_establishment(establishment_id: str, data: EtablissementAddStudent):
    """Enroll an existing student into this establishment via SPARQL 1.1 INSERT DATA (edu:appartientA)."""
    try:
        result = await etablissement_service.add_student(establishment_id, data.student_id)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec du rattachement de l'étudiant",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error adding student %s to establishment %s: %s", data.student_id, establishment_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du rattachement de l'étudiant: {str(e)}",
        )


@router.delete("/{establishment_id}/students/{student_id}", summary="Remove a student from an establishment")
async def remove_student_from_establishment(establishment_id: str, student_id: str):
    """Remove a student link from this establishment via SPARQL 1.1 DELETE DATA."""
    try:
        result = await etablissement_service.remove_student(establishment_id, student_id)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error") or "Échec du retrait de l'étudiant",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error removing student %s from establishment %s: %s", student_id, establishment_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du retrait de l'étudiant: {str(e)}",
        )



@router.post("/chat", response_model=EtablissementCommandResponse, summary="Execute natural language command for Établissements")
async def execute_etablissement_chat(req: EtablissementCommandRequest):
    """Execute natural language CRUD & filter commands (e.g. 'créer une université privée nommée SESAME à Ariana')."""
    try:
        return await etablissement_service.execute_chat_command(req.command)
    except Exception as e:
        logger.error("Error processing chat command '%s': %s", req.command, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement de la commande TALN: {str(e)}",
        )
