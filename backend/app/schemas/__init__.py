"""Data schemas package."""

from .health import AppInfoResponse, HealthResponse, ServiceStatus
from .sparql import (
    SparqlQueryRequest,
    SparqlQueryResponse,
    GraphStatsResponse,
)
from .ontology import (
    OntologyClassItem,
    OntologyClassesResponse,
    OntologyIndividualItem,
    OntologyIndividualDetail,
    OntologyIndividualsResponse,
)
from .nlp import (
    NlpQueryRequest,
    NlpQueryResponse,
    ExtractedEntity,
    SampleQuestion,
)

__all__ = [
    "AppInfoResponse",
    "HealthResponse",
    "ServiceStatus",
    "SparqlQueryRequest",
    "SparqlQueryResponse",
    "GraphStatsResponse",
    "OntologyClassItem",
    "OntologyClassesResponse",
    "OntologyIndividualItem",
    "OntologyIndividualDetail",
    "OntologyIndividualsResponse",
    "NlpQueryRequest",
    "NlpQueryResponse",
    "ExtractedEntity",
    "SampleQuestion",
]
