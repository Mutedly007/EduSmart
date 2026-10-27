"""Unit and integration tests for Compétences endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_competences() -> None:
    """Verify listing competences returns 200 OK and expected individuals."""
    response = client.get("/api/competences")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    ids = [item["id"] for item in data]
    assert "Algorithmique_Individu" in ids
    assert "Programmation_Individu" in ids


def test_list_competence_classes() -> None:
    """Verify getting competence subclasses returns 200 OK and categories."""
    response = client.get("/api/competences/classes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    names = [c["class_name"] for c in data]
    assert "Programmation" in names
    assert "SQL" in names


def test_competence_chat_command() -> None:
    """Verify natural language TALN command returns 200 OK."""
    response = client.post(
        "/api/competences/chat",
        json={"command": "lister les compétences"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["action"] == "list"
    assert "records" in data
