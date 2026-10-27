"""Pydantic schemas for Compétence CRUD and natural language chat commands."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CompetenceItem(BaseModel):
    """Schema representing an individual in the Compétence branch."""
    id: str = Field(..., description="Local name / identifier of the individual")
    uri: str = Field(..., description="Full RDF URI")
    label: str = Field(..., description="Human-readable title or label of the competence")
    class_name: str = Field(..., description="Direct ontological class (e.g. Programmation, SQL, Cybersécurité)")
    category: Optional[str] = Field(None, description="Broad category: Technique, Transversale, Linguistique")
    description: Optional[str] = Field(None, description="Detailed pedagogical description of the competence")
    niveau: Optional[str] = Field(None, description="Competence level (Débutant, Intermédiaire, Avancé, Expert)")
    langue: Optional[str] = Field(None, description="Target language if linguistic competence (Français, Anglais, etc.)")
    prerequis_pour: List[str] = Field(default_factory=list, description="Courses that require this competence as prerequisite")
    developpee_par: List[str] = Field(default_factory=list, description="Courses that develop this competence")
    acquise_par: List[str] = Field(default_factory=list, description="Students who have acquired this competence")


class CompetenceCreate(BaseModel):
    """Schema for creating a new Compétence individual."""
    id: Optional[str] = Field(None, description="Optional custom ID. If omitted, generated from label.")
    label: str = Field(..., min_length=2, description="Label / title of the competence")
    class_name: str = Field(default="Programmation", description="Class type under Compétence")
    description: Optional[str] = Field(None, description="Pedagogical description")
    niveau: Optional[str] = Field(default="Intermédiaire", description="Level (Débutant, Intermédiaire, Avancé, Expert)")
    langue: Optional[str] = Field(None, description="Language name (for linguistic skills)")


class CompetenceUpdate(BaseModel):
    """Schema for updating an existing Compétence individual."""
    label: Optional[str] = Field(None, description="Updated label / title")
    class_name: Optional[str] = Field(None, description="Updated class type")
    description: Optional[str] = Field(None, description="Updated description")
    niveau: Optional[str] = Field(None, description="Updated level")
    langue: Optional[str] = Field(None, description="Updated language")


class CompetenceClassItem(BaseModel):
    """Ontological subclass item under Compétence."""
    class_name: str
    label: Optional[str] = None
    category: Optional[str] = None
    parent: Optional[str] = None


class CompetenceCommandRequest(BaseModel):
    """Natural language command request for Compétences."""
    command: str = Field(
        ...,
        min_length=3,
        description="Command in French or English (e.g. 'créer une compétence nommée Machine Learning de niveau Avancé')",
    )


class CompetenceCommandResponse(BaseModel):
    """Response of executing a natural language command for Compétences."""
    success: bool
    action: str  # create, update, delete, list, unknown
    message: str
    sparql: Optional[str] = None
    affected_id: Optional[str] = None
    records: Optional[List[Dict[str, Any]]] = None
