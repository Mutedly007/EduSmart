"""API routing package."""

from fastapi import APIRouter
from .routes.health import router as health_router
from .routes.sparql import router as sparql_router
from .routes.ontology import router as ontology_router
from .routes.nlp import router as nlp_router
from .routes.personnes import router as personnes_router
from .routes.competences import router as competences_router
from .routes.formations import router as formations_router

api_router = APIRouter()

# Health & metadata endpoints (/ and /health)
api_router.include_router(health_router, tags=["System & Health"])

# SPARQL query engine endpoints (/api/sparql)
api_router.include_router(sparql_router, prefix="/api")

# Ontology navigation endpoints (/api/ontology)
api_router.include_router(ontology_router, prefix="/api")

# TALN / NLP Natural Language Question endpoints (/api/nlp)
api_router.include_router(nlp_router, prefix="/api")

# Personnes CRUD & TALN endpoints (/api/personnes)
api_router.include_router(personnes_router, prefix="/api")

# Compétences CRUD & TALN endpoints (/api/competences)
api_router.include_router(competences_router, prefix="/api")

# Formation CRUD endpoints (/api/formations)
api_router.include_router(formations_router, prefix="/api")

__all__ = ["api_router"]
