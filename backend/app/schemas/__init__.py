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
from .personne import (
    PersonneItem,
    PersonneCreate,
    PersonneUpdate,
    PersonneClassItem,
    PersonneCommandRequest,
    PersonneCommandResponse,
)
from .competence import (
    CompetenceItem,
    CompetenceCreate,
    CompetenceUpdate,
    CompetenceClassItem,
    CompetenceCommandRequest,
    CompetenceCommandResponse,
)
from .apprentissage import (
    ApprentissageItem,
    ApprentissageCreate,
    ApprentissageUpdate,
    ApprentissageClassItem,
    ApprentissageCommandRequest,
    ApprentissageCommandResponse,
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
    "PersonneItem",
    "PersonneCreate",
    "PersonneUpdate",
    "PersonneClassItem",
    "PersonneCommandRequest",
    "PersonneCommandResponse",
    "CompetenceItem",
    "CompetenceCreate",
    "CompetenceUpdate",
    "CompetenceClassItem",
    "CompetenceCommandRequest",
    "CompetenceCommandResponse",
    "ApprentissageItem",
    "ApprentissageCreate",
    "ApprentissageUpdate",
    "ApprentissageClassItem",
    "ApprentissageCommandRequest",
    "ApprentissageCommandResponse",
]
