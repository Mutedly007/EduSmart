"""API routing package."""

from fastapi import APIRouter
from .routes.health import router as health_router
from .routes.sparql import router as sparql_router
from .routes.ontology import router as ontology_router

api_router = APIRouter()

# Health & metadata endpoints (/ and /health)
api_router.include_router(health_router, tags=["System & Health"])

# SPARQL query engine endpoints (/api/sparql)
api_router.include_router(sparql_router, prefix="/api")

# Ontology navigation endpoints (/api/ontology)
api_router.include_router(ontology_router, prefix="/api")

__all__ = ["api_router"]
