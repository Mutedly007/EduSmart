"""Unit and integration tests for Apprentissage endpoints and TALN/NLP commands."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_apprentissages() -> None:
    """Verify listing learning items returns 200 OK and expected individuals."""
    response = client.get("/api/apprentissage")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    labels = [item["label"] for item in data]
    assert any("Java" in lbl for lbl in labels)


def test_list_apprentissage_classes() -> None:
    """Verify getting apprentissage subclasses returns 200 OK and categories."""
    response = client.get("/api/apprentissage/classes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 6
    class_names = [c["class_name"] for c in data]
    assert "Examen" in class_names or "Examen_Final" in class_names


def test_apprentissage_chat_create_and_update() -> None:
    """Verify TALN commands: create an evaluation, then update its score."""
    # 1. Create
    create_resp = client.post(
        "/api/apprentissage/chat",
        json={"command": "créer un examen nommé Examen Final Web Sémantique avec score 18.5"},
    )
    assert create_resp.status_code == 200
    create_data = create_resp.json()
    assert create_data["success"] is True
    assert create_data["action"] == "create"

    # 2. Update score
    update_resp = client.post(
        "/api/apprentissage/chat",
        json={"command": "modifier le score de Examen Final Web Sémantique a 10"},
    )
    assert update_resp.status_code == 200
    update_data = update_resp.json()
    assert update_data["success"] is True
    assert update_data["action"] == "update"
    assert "10" in update_data["message"]
    assert "DELETE" in update_data["sparql"]
    assert "INSERT" in update_data["sparql"]


def test_apprentissage_chat_list() -> None:
    """Verify TALN list command returns 200 OK."""
    response = client.post(
        "/api/apprentissage/chat",
        json={"command": "lister les évaluations"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["action"] == "list"
    assert "records" in data
