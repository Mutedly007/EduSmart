"""Application configuration settings for EduSmart.

Loads configuration from environment variables and .env file.
Prepares placeholders for Fuseki, RDFLib, and spaCy.
"""

import os
from typing import List

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    # Graceful fallback if pydantic_settings is not yet installed
    from pydantic import BaseModel as BaseSettings  # type: ignore
    SettingsConfigDict = None  # type: ignore


class Settings(BaseSettings):
    """Application settings and configuration parameters."""

    # Project metadata
    PROJECT_NAME: str = "EduSmart API"
    PROJECT_DESCRIPTION: str = (
        "Semantic Web backend for Education and Training domain. "
        "Integrates RDFLib, Apache Jena Fuseki, and custom TALN translation logic."
    )
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server settings
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000

    # CORS settings
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Apache Jena Fuseki configuration (Placeholders for Phase 2+)
    FUSEKI_BASE_URL: str = "http://localhost:3030"
    FUSEKI_DATASET: str = "edusmart"
    FUSEKI_QUERY_ENDPOINT: str = "http://localhost:3030/edusmart/query"
    FUSEKI_UPDATE_ENDPOINT: str = "http://localhost:3030/edusmart/update"

    # Semantic Web & Ontology configuration
    ONTOLOGY_FILE_PATH: str = "./ontology/edusmart.owl"
    ONTOLOGY_DEFAULT_GRAPH_URI: str = "http://edusmart.org/ontology#"

    # spaCy NLP configuration (Placeholders for Phase 2+)
    SPACY_MODEL: str = "en_core_web_sm"

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated allowed origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    if SettingsConfigDict is not None:
        model_config = SettingsConfigDict(
            env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
            env_file_encoding="utf-8",
            extra="ignore",
        )


settings = Settings()
