"""Pydantic schemas for ontology classes and individuals."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class OntologyClassItem(BaseModel):
    """Schema representing an OWL/RDFS class entity."""

    uri: str = Field(..., description="Full URI of the class.")
    name: str = Field(..., description="Local name / identifier of the class.")
    label: Optional[str] = Field(None, description="Human-readable label if available.")
    parent_uri: Optional[str] = Field(None, description="Direct superclass URI if available.")
    parent_name: Optional[str] = Field(None, description="Direct superclass name if available.")
    subclasses_count: int = Field(0, description="Number of direct subclasses.")
    instances_count: int = Field(0, description="Number of direct named individuals.")


class OntologyClassesResponse(BaseModel):
    """List response for ontology classes."""

    total_classes: int = Field(..., description="Total classes found.")
    root_branches: List[str] = Field(..., description="The main 5 top-level branches.")
    classes: List[OntologyClassItem] = Field(..., description="List of class entities.")


class PropertyAssertion(BaseModel):
    """Represents a property-value assertion for an individual."""

    property_uri: str = Field(..., description="Property full URI.")
    property_name: str = Field(..., description="Property local name.")
    property_type: str = Field(..., description="'object' or 'datatype'.")
    value: Any = Field(..., description="Target individual name, URI, or literal value.")
    label: Optional[str] = Field(None, description="Display label for the property.")


class OntologyIndividualItem(BaseModel):
    """Summary of a named individual in the knowledge graph."""

    uri: str = Field(..., description="Full URI of the individual.")
    name: str = Field(..., description="Local name of the individual.")
    types: List[str] = Field(..., description="Classes the individual belongs to.")
    label: Optional[str] = Field(None, description="Display name / label.")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Key-value property map.")


class OntologyIndividualDetail(BaseModel):
    """Detailed view of an individual with outgoing and incoming relations."""

    uri: str = Field(..., description="Full URI of the individual.")
    name: str = Field(..., description="Local name of the individual.")
    types: List[str] = Field(..., description="Classes the individual belongs to.")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Datatype attributes (name, email, etc.).")
    relationships: List[PropertyAssertion] = Field(default_factory=list, description="Object property connections.")
    incoming_relations: List[PropertyAssertion] = Field(
        default_factory=list, description="Relations pointing to this individual."
    )


class OntologyIndividualsResponse(BaseModel):
    """Response containing named individuals."""

    total: int = Field(..., description="Total count of individuals returned.")
    individuals: List[OntologyIndividualItem] = Field(..., description="List of individuals.")
