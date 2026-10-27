"""Unit and integration tests for Établissements endpoints and semantic hub."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_etablissements() -> None:
    """Verify listing establishments returns 200 OK and expected individuals."""
    response = client.get("/api/etablissements")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    ids = [item["id"] for item in data]
    assert "ESPRIT" in ids


def test_list_etablissement_classes() -> None:
    """Verify getting establishment subclasses returns 200 OK and categories."""
    response = client.get("/api/etablissements/classes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    names = [c["class_name"] for c in data]
    assert "Universite_Privee" in names
    assert "Ecole" in names


def test_etablissement_semantic_hub() -> None:
    """Verify that ESPRIT returns its Inter-Branch Semantic Hub connections."""
    response = client.get("/api/etablissements/ESPRIT")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "ESPRIT"
    assert data["ville"] == "Ariana"
    # Verify Semantic Hub relations (Formations, Programmes, Inscriptions)
    formations = [f["id"] for f in data["formations_organisees"]]
    assert "Formation_Java" in formations

    progs = [p["id"] for p in data["programmes_proposes"]]
    assert "Licence_Informatique" in progs

    students = [s["id"] for s in data["etudiants_inscrits"]]
    assert "ahmed" in students


def test_etablissement_turtle_export() -> None:
    """Verify exporting establishment RDF in W3C Turtle format."""
    response = client.get("/api/etablissements/ESPRIT/turtle")
    assert response.status_code == 200
    assert "@prefix" in response.text
    assert "ESPRIT" in response.text


def test_etablissement_chat_command() -> None:
    """Verify natural language TALN command returns 200 OK."""
    response = client.post(
        "/api/etablissements/chat",
        json={"command": "lister les universités privées"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["action"] == "list"
    assert "records" in data
