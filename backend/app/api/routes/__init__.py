"""API routes subpackage."""

from .health import router as health_router
from .sparql import router as sparql_router
from .ontology import router as ontology_router

__all__ = ["health_router", "sparql_router", "ontology_router"]
