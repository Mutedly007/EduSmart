"""Pydantic schemas for Personnes CRUD and natural language commands."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PersonneItem(BaseModel):
    """Schema representing an individual in the Personnes branch."""
    id: str = Field(..., description="Local name / identifier of the individual")
    uri: str = Field(..., description="Full RDF URI")
    label: str = Field(..., description="Human-readable full name or label")
    class_name: str = Field(..., description="Direct ontological class (e.g. Enseignant, Etudiant)")
    email: Optional[str] = Field(None, description="Email address")
    telephone: Optional[str] = Field(None, description="Phone number")
    grade: Optional[str] = Field(None, description="Academic grade if teacher")
    specialite: Optional[str] = Field(None, description="Specialty or field")
    statut: Optional[str] = Field(None, description="Status (Temps_Plein, Inscrit, etc.)")


class PersonneCreate(BaseModel):
    """Schema for creating a new Personne individual."""
    id: Optional[str] = Field(None, description="Optional custom ID. If omitted, generated from label.")
    label: str = Field(..., min_length=2, description="Full name / label of the person")
    class_name: str = Field(default="Etudiant", description="Class type (e.g. Etudiant, Enseignant, Professeur)")
    email: Optional[str] = Field(None, description="Email address")
    telephone: Optional[str] = Field(None, description="Phone number")
    grade: Optional[str] = Field(None, description="Academic grade")
    specialite: Optional[str] = Field(None, description="Specialty / Field")


class PersonneUpdate(BaseModel):
    """Schema for updating an existing Personne individual."""
    label: Optional[str] = Field(None, description="Updated label / full name")
    class_name: Optional[str] = Field(None, description="Updated class type")
    email: Optional[str] = Field(None, description="Updated email")
    telephone: Optional[str] = Field(None, description="Updated phone")
    grade: Optional[str] = Field(None, description="Updated grade")
    specialite: Optional[str] = Field(None, description="Updated specialty")


class PersonneClassItem(BaseModel):
    """Ontological subclass item under Personnes."""
    class_name: str
    label: Optional[str] = None
    description: Optional[str] = None


class PersonneCommandRequest(BaseModel):
    """Natural language command request for Personnes."""
    command: str = Field(..., min_length=3, description="Command in French or English (e.g. 'créer un étudiant nommé Yassine')")


class PersonneCommandResponse(BaseModel):
    """Response of executing a natural language command for Personnes."""
    success: bool
    action: str  # create, delete, list, unknown
    message: str
    sparql: Optional[str] = None
    affected_id: Optional[str] = None
    records: Optional[List[Dict[str, Any]]] = None
