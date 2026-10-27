"""Unit and integration tests for root and health endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint() -> None:
    """Verify that root endpoint returns application metadata and 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "app_name" in data
    assert "EduSmart" in data["app_name"]
    assert "version" in data
    assert data["docs_url"] == "/docs"


def test_health_endpoint() -> None:
    """Verify that /health returns operational status and service breakdown."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data
    assert "fuseki_sparql" in data["services"]
    # Ensure Fuseki status is either standby or online depending on local environment
    assert data["services"]["fuseki_sparql"]["status"] in ("standby", "online")
