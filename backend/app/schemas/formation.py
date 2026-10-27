"""Pydantic schemas for Formation CRUD operations."""

from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class FormationItem(BaseModel):
    """Schema representing an individual in the Formation branch."""

    id: str = Field(..., description="Local name / identifier of the formation")
    uri: str = Field(..., description="Full RDF URI")
    label: str = Field(..., description="Human-readable formation name")
    class_name: str = Field(..., description="Direct ontological class")
    description: Optional[str] = None
    duration: Optional[Decimal] = Field(None, description="Duration in the ontology's configured unit")
    objective: Optional[str] = None
    price: Optional[Decimal] = None
    domain: Optional[str] = Field(None, description="Linked Domaine_Formation identifier")
    modality: Optional[str] = Field(None, description="Linked Modalité_Formation identifier")


class FormationCreate(BaseModel):
    """Schema for creating a new Formation individual."""

    model_config = ConfigDict(str_strip_whitespace=True)

    id: Optional[str] = Field(None, description="Optional custom ID. If omitted, generated from label.")
    label: str = Field(..., min_length=2, description="Formation name")
    class_name: str = Field(default="Formation", description="Ontology class for this formation")
    description: Optional[str] = None
    duration: Optional[Decimal] = Field(None, ge=0, description="Duration in the ontology's configured unit")
    objective: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    domain: Optional[str] = Field(None, description="Local identifier of a Domaine_Formation individual")
    modality: Optional[str] = Field(None, description="Local identifier of a Modalité_Formation individual")


class FormationUpdate(BaseModel):
    """Schema for updating an existing Formation individual."""

    model_config = ConfigDict(str_strip_whitespace=True)

    label: Optional[str] = Field(None, min_length=2)
    class_name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[Decimal] = Field(None, ge=0)
    objective: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    domain: Optional[str] = None
    modality: Optional[str] = None


class FormationCommandRequest(BaseModel):
    """Natural-language command request for Formation."""

    command: str = Field(..., min_length=3, description="Deterministic command in French or English")


class FormationCommandResponse(BaseModel):
    """Result of a natural-language Formation command."""

    success: bool
    action: str
    message: str
    sparql: Optional[str] = None
    affected_id: Optional[str] = None
    records: Optional[List[Dict[str, Any]]] = None
