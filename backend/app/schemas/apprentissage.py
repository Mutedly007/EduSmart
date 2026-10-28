"""Pydantic schemas for Apprentissage CRUD and natural language chat commands."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ApprentissageItem(BaseModel):
    """Schema representing an individual in the Apprentissage branch."""
    id: str = Field(..., description="Local name / identifier of the individual")
    uri: str = Field(..., description="Full RDF URI")
    label: str = Field(..., description="Human-readable title or label of the activity/evaluation/pathway")
    class_name: str = Field(..., description="Direct ontological class (e.g. Examen, TP_Guidé, Parcours_Licence)")
    category: Optional[str] = Field(None, description="Broad category: Évaluation, Activité, Parcours, Type_Apprentissage")
    modalite: Optional[str] = Field(None, description="Pedagogical modality: Présentiel, En ligne, Hybride")
    description: Optional[str] = Field(None, description="Detailed description of the learning activity")
    score: Optional[float] = Field(None, description="Score or grade for evaluations (e.g. 15.5 / 20)")
    date_evaluation: Optional[str] = Field(None, description="Evaluation date (YYYY-MM-DD)")
    statut: Optional[str] = Field(None, description="Status: Planifié, En cours, Validé, Terminé")
    evalue_competence: Optional[str] = Field(None, description="URI or name of evaluated competence")
    competence_label: Optional[str] = Field(None, description="Human label of evaluated competence")


class ApprentissageCreate(BaseModel):
    """Schema for creating a new Apprentissage individual."""
    id: Optional[str] = Field(None, description="Optional custom ID. If omitted, generated from label.")
    label: str = Field(..., min_length=2, description="Label / title of the learning item")
    class_name: str = Field(default="Examen", description="Class type under Apprentissage")
    category: Optional[str] = Field(default="Évaluation", description="Category: Évaluation, Activité, Parcours, Type")
    modalite: Optional[str] = Field(default="Présentiel", description="Modality: Présentiel, En ligne, Hybride")
    description: Optional[str] = Field(None, description="Pedagogical description")
    score: Optional[float] = Field(None, description="Score or benchmark (e.g. 16.0)")
    date_evaluation: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    statut: Optional[str] = Field(default="Planifié", description="Status: Planifié, En cours, Validé, Terminé")
    evalue_competence: Optional[str] = Field(None, description="ID or URI of evaluated competence")


class ApprentissageUpdate(BaseModel):
    """Schema for updating an existing Apprentissage individual."""
    label: Optional[str] = Field(None, description="Updated label / title")
    class_name: Optional[str] = Field(None, description="Updated class type")
    category: Optional[str] = Field(None, description="Updated category")
    modalite: Optional[str] = Field(None, description="Updated modality")
    description: Optional[str] = Field(None, description="Updated description")
    score: Optional[float] = Field(None, description="Updated score")
    date_evaluation: Optional[str] = Field(None, description="Updated date")
    statut: Optional[str] = Field(None, description="Updated status")
    evalue_competence: Optional[str] = Field(None, description="Updated competence")


class ApprentissageClassItem(BaseModel):
    """Ontological subclass item under Apprentissage."""
    class_name: str
    label: Optional[str] = None
    category: Optional[str] = None
    parent: Optional[str] = None


class ApprentissageCommandRequest(BaseModel):
    """Natural language command request for Apprentissage."""
    command: str = Field(
        ...,
        min_length=3,
        description="Command in French or English (e.g. 'créer un examen nommé Examen Web Sémantique avec score 17')",
    )


class ApprentissageCommandResponse(BaseModel):
    """Response of executing a natural language command for Apprentissage."""
    success: bool
    action: str  # create, update, delete, list, unknown
    message: str
    sparql: Optional[str] = None
    affected_id: Optional[str] = None
    records: Optional[List[Dict[str, Any]]] = None
