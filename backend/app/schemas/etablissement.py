"""Pydantic schemas for Établissement CRUD, semantic hub relations, and TALN commands."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EtablissementRelationItem(BaseModel):
    """Inter-branch related entity item (Formation, Programme, Etudiant, Enseignant)."""
    id: str = Field(..., description="Local identifier of the related individual")
    uri: str = Field(..., description="Full URI of the individual")
    label: str = Field(..., description="Display label or title")
    type_name: Optional[str] = Field(None, description="Ontological type of the related entity")


class EtablissementItem(BaseModel):
    """Schema representing an individual in the Établissement branch."""
    id: str = Field(..., description="Local identifier (URI fragment, e.g. ESPRIT)")
    uri: str = Field(..., description="Full RDF URI in the ontology")
    label: str = Field(..., description="Display name / label of the establishment")
    class_name: str = Field(..., description="Ontology class (e.g. Universite_Privee, Universite_Publique, Ecole, Institut, Centre_Formation)")
    ville: Optional[str] = Field(None, description="City location (e.g. Ariana, Tunis, Sousse, Sfax)")
    adresse: Optional[str] = Field(None, description="Street address")
    site_web: Optional[str] = Field(None, description="Official website URL")
    telephone: Optional[str] = Field(None, description="Contact phone number")
    email: Optional[str] = Field(None, description="Official contact email")
    statut: Optional[str] = Field(None, description="Operational status (e.g. Accrédité, Privé, Public, Partenaire, Actif)")
    description: Optional[str] = Field(None, description="Institutional or historical description")
    mode_enseignement: Optional[str] = Field(None, description="Dominant teaching mode (Présentiel, Hybride, Distance)")
    domaine: Optional[str] = Field(None, description="Primary academic domain (Informatique, Ingénierie, Gestion)")
    
    # Valeur Ajoutée n°1: Le Hub Sémantique Inter-Branches
    formations_organisees: List[EtablissementRelationItem] = Field(
        default_factory=list,
        description="Formations organised via edu:organise",
    )
    programmes_proposes: List[EtablissementRelationItem] = Field(
        default_factory=list,
        description="Curricula and programs proposed via edu:propose",
    )
    etudiants_inscrits: List[EtablissementRelationItem] = Field(
        default_factory=list,
        description="Students enrolled in this establishment via inverse edu:appartientA",
    )
    enseignants_affilies: List[EtablissementRelationItem] = Field(
        default_factory=list,
        description="Teachers affiliated via courses proposed by this establishment",
    )


class EtablissementCreate(BaseModel):
    """Schema for creating a new Établissement individual in Fuseki."""
    id: Optional[str] = Field(None, description="Optional custom ID. If omitted, derived from label.")
    label: str = Field(..., min_length=2, description="Establishment name")
    class_name: str = Field(default="Universite_Privee", description="Subclass under Etablissement")
    ville: Optional[str] = Field(default="Tunis", description="City location")
    adresse: Optional[str] = Field(None, description="Physical address")
    site_web: Optional[str] = Field(None, description="Website URL")
    telephone: Optional[str] = Field(None, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    statut: Optional[str] = Field(default="Accrédité", description="Accreditation / institutional status")
    description: Optional[str] = Field(None, description="Description of the establishment")
    mode_enseignement: Optional[str] = Field(default="Présentiel", description="Teaching modality")
    domaine: Optional[str] = Field(default="Informatique", description="Main specialization domain")


class EtablissementUpdate(BaseModel):
    """Schema for updating an existing Établissement individual."""
    label: Optional[str] = Field(None, description="Updated name")
    class_name: Optional[str] = Field(None, description="Updated class type")
    ville: Optional[str] = Field(None, description="Updated city")
    adresse: Optional[str] = Field(None, description="Updated address")
    site_web: Optional[str] = Field(None, description="Updated website")
    telephone: Optional[str] = Field(None, description="Updated telephone")
    email: Optional[str] = Field(None, description="Updated email")
    statut: Optional[str] = Field(None, description="Updated status")
    description: Optional[str] = Field(None, description="Updated description")
    mode_enseignement: Optional[str] = Field(None, description="Updated teaching modality")
    domaine: Optional[str] = Field(None, description="Updated domain")


class EtablissementClassItem(BaseModel):
    """Ontological subclass item under Établissement."""
    class_name: str
    label: Optional[str] = None
    category: Optional[str] = None
    parent: Optional[str] = None


class EtablissementCommandRequest(BaseModel):
    """Natural language command request for Établissements."""
    command: str = Field(
        ...,
        min_length=3,
        description="Command in French or English (e.g. 'créer une université privée nommée SESAME à Ariana')",
    )


class EtablissementCommandResponse(BaseModel):
    """Response of executing a natural language command for Établissements."""
    success: bool
    action: str  # create, update, delete, list, filter, unknown
    message: str
    sparql: Optional[str] = None
    affected_id: Optional[str] = None
    records: Optional[List[Dict[str, Any]]] = None
