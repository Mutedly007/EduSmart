"""Schemas for health check and system information endpoints."""

from datetime import datetime, timezone
from typing import Dict
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    """Status description of an internal or external dependency."""

    name: str = Field(..., description="Service identifier")
    status: str = Field(..., description="Current status (e.g. online, standby, unconfigured)")
    details: str = Field(..., description="Informational message regarding the service status")


class HealthResponse(BaseModel):
    """Schema for /health endpoint response."""

    status: str = Field("healthy", description="Overall backend health status")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of check"
    )
    version: str = Field(..., description="Backend application version")
    environment: str = Field(..., description="Current runtime environment")
    services: Dict[str, ServiceStatus] = Field(
        ...,
        description="Status of connected services and components (without false claims of connection)"
    )


class AppInfoResponse(BaseModel):
    """Schema for root / endpoint response."""

    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    description: str = Field(..., description="Brief description of the platform")
    docs_url: str = Field("/docs", description="Interactive OpenAPI documentation URL")
    redoc_url: str = Field("/redoc", description="ReDoc documentation URL")
    semantic_engine: str = Field(
        "RDFLib (Local) + Apache Jena Fuseki (Planned SPARQL Server)",
        description="Configured semantic web engine"
    )
    nlp_engine: str = Field(
        "spaCy + Custom TALN Translation Rules (Planned, Non-LLM)",
        description="Configured natural language processing engine"
    )
    status: str = Field("Phase 1: Environment & Architecture Initialized", description="Current development phase")
