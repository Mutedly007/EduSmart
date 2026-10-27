"""Health verification and system metadata endpoints."""

import os
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import AppInfoResponse, HealthResponse, ServiceStatus

router = APIRouter()


@router.get(
    "/",
    response_model=AppInfoResponse,
    summary="Get EduSmart API information",
    description="Returns metadata about the EduSmart Semantic Web backend and development status.",
)
async def get_app_info() -> AppInfoResponse:
    """Return platform metadata and documentation endpoints."""
    return AppInfoResponse(
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.PROJECT_DESCRIPTION,
        docs_url="/docs",
        redoc_url="/redoc",
        semantic_engine="RDFLib (Local) + Apache Jena Fuseki (Planned SPARQL Server)",
        nlp_engine="spaCy + Custom TALN Translation Rules (Planned, Non-LLM)",
        status="Phase 1: Environment & Architecture Initialized",
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Backend health and dependency status check",
    description=(
        "Verifies that the FastAPI backend is running and reports the standby status "
        "of semantic and NLP subsystems without falsely reporting external connections."
    ),
)
async def check_health() -> HealthResponse:
    """Return backend operational status and truthful status of subsystems."""
    # Check whether the ontology file exists on disk
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    target_path = (
        settings.ONTOLOGY_FILE_PATH
        if os.path.isabs(settings.ONTOLOGY_FILE_PATH)
        else os.path.join(backend_root, settings.ONTOLOGY_FILE_PATH)
    )
    ontology_present = os.path.exists(target_path)
    ontology_status = (
        "ready_for_ingestion"
        if ontology_present
        else "standby_no_file"
    )
    ontology_details = (
        f"Ontology file detected at '{settings.ONTOLOGY_FILE_PATH}'."
        if ontology_present
        else f"No ontology file at '{settings.ONTOLOGY_FILE_PATH}'. Expected to be created/validated in Protégé."
    )

    # Check live Fuseki connection
    from app.services.sparql_service import sparql_service
    fuseki_online, fuseki_msg, fuseki_triples = await sparql_service.check_connection()
    if fuseki_online:
        fuseki_status = "online"
        fuseki_details = f"Connected to Apache Jena Fuseki dataset '{settings.FUSEKI_DATASET}' ({fuseki_triples} triples ingested)."
    else:
        fuseki_status = "offline"
        fuseki_details = f"Fuseki not responding at {settings.FUSEKI_QUERY_ENDPOINT}. Reason: {fuseki_msg}"

    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        services={
            "api_server": ServiceStatus(
                name="FastAPI Core Engine",
                status="online",
                details=f"FastAPI running in {settings.ENVIRONMENT} mode on port {settings.BACKEND_PORT}.",
            ),
            "fuseki_sparql": ServiceStatus(
                name="Apache Jena Fuseki",
                status=fuseki_status,
                details=fuseki_details,
            ),
            "semantic_graph": ServiceStatus(
                name="RDFLib Knowledge Graph",
                status=ontology_status,
                details=ontology_details,
            ),
            "nlp_pipeline": ServiceStatus(
                name="spaCy TALN Module",
                status="standby",
                details=(
                    f"Configured model: '{settings.SPACY_MODEL}'. "
                    "Rule-based SPARQL translation module planned for Phase 2."
                ),
            ),
        },
    )
