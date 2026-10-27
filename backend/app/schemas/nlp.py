"""Pydantic schemas for the TALN / NLP-to-SPARQL translation engine."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NlpQueryRequest(BaseModel):
    """Request schema for asking a natural language question."""

    question: str = Field(
        ...,
        description="Natural language question in French or English.",
        examples=[
            "Quels sont les cours proposés par ESPRIT ?",
            "Qui enseigne le cours de Java ?",
            "Quelles sont les formations hybrides ?",
            "Quels sont les étudiants ?",
            "Who teaches Java?",
        ],
    )
    execute: bool = Field(
        True,
        description="Whether to execute the generated SPARQL query against Fuseki immediately.",
    )


class ExtractedEntity(BaseModel):
    """Represents an extracted entity from the natural language query."""

    text: str = Field(..., description="Entity token text in the question.")
    entity_type: str = Field(..., description="Entity type: 'individual', 'class', 'modality', or 'property'.")
    matched_uri: Optional[str] = Field(None, description="Mapped ontology URI.")
    matched_name: Optional[str] = Field(None, description="Mapped ontology local name.")


class NlpQueryResponse(BaseModel):
    """Response schema for NLP translation and execution."""

    success: bool = Field(..., description="Whether translation (and execution) succeeded.")
    question: str = Field(..., description="Original user question.")
    language: str = Field(..., description="Detected language ('fr' or 'en').")
    intent: str = Field(..., description="Classified intent.")
    entities: List[ExtractedEntity] = Field(default_factory=list, description="Extracted entities.")
    sparql_query: str = Field(..., description="Deterministic generated SPARQL 1.1 query.")
    explanation: str = Field(..., description="Human-readable explanation of how the question was translated.")
    records: Optional[List[Dict[str, Any]]] = Field(
        None, description="Result records formatted as key-value rows for UI table."
    )
    total_records: int = Field(0, description="Total records returned.")
    execution_source: Optional[str] = Field(
        None, description="'fuseki', 'rdflib_fallback', or 'translation_only'."
    )
    processing_time_ms: float = Field(..., description="Total pipeline latency in milliseconds.")
    error: Optional[str] = Field(None, description="Error message if translation or query failed.")


class SampleQuestion(BaseModel):
    """Sample natural language question supported by the system."""

    category: str = Field(..., description="Category (e.g. 'Cours & Formations', 'Enseignants', 'Universités').")
    language: str = Field(..., description="'fr' or 'en'.")
    question: str = Field(..., description="Sample question text.")
    description: str = Field(..., description="Brief description of what this query demonstrates.")
