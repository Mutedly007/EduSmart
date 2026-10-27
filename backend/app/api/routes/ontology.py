"""Ontology entity and class hierarchy navigation API endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.ontology import (
    OntologyClassesResponse,
    OntologyIndividualDetail,
    OntologyIndividualsResponse,
)
from app.services.sparql_service import sparql_service

router = APIRouter(prefix="/ontology", tags=["Ontology & Knowledge Graph"])


@router.get(
    "/classes",
    response_model=OntologyClassesResponse,
    summary="Get ontology class hierarchy",
    description="Returns all 305 classes across the 5 main branches with subClassOf relationships.",
)
async def get_ontology_classes() -> OntologyClassesResponse:
    """Return all classes declared in the ontology."""
    res = await sparql_service.get_classes()
    return OntologyClassesResponse(**res)


@router.get(
    "/individuals",
    response_model=OntologyIndividualsResponse,
    summary="List named individuals in the graph",
    description="Returns individuals (students, teachers, universities, courses) optionally filtered by class.",
)
async def get_ontology_individuals(
    class_name: Optional[str] = Query(
        None,
        description="Filter by class name (e.g. 'Etudiant', 'Enseignant', 'Formation', 'Universite_Privee')",
    )
) -> OntologyIndividualsResponse:
    """Return named individuals in the ontology."""
    individuals = await sparql_service.get_individuals(class_name)
    return OntologyIndividualsResponse(
        total=len(individuals),
        individuals=individuals,
    )


@router.get(
    "/individuals/{name}",
    response_model=OntologyIndividualDetail,
    summary="Get details of a specific individual",
    description="Returns attributes and outgoing/incoming relationships for an individual (e.g. Ali, ESPRIT, ahmed, java).",
)
async def get_individual_detail(name: str) -> OntologyIndividualDetail:
    """Return full graph details for a named individual."""
    detail = await sparql_service.get_individual_detail(name)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Individual '{name}' not found in the knowledge graph.",
        )
    return OntologyIndividualDetail(**detail)
