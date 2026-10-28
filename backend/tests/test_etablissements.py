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


def test_etablissement_chat_create() -> None:
    """Verify TALN creation adds an establishment that appears in records and the list."""
    import uuid
    uid = uuid.uuid4().hex[:6]
    label = f"Campus_{uid}"
    response = client.post(
        "/api/etablissements/chat",
        json={"command": f"créer une université privée nommée {label} à Tunis"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["action"] == "create"
    assert any(x["label"] == label or x["id"] == label for x in data["records"])

    # Verify /api/etablissements includes it
    list_resp = client.get("/api/etablissements")
    assert list_resp.status_code == 200
    assert any(x["label"] == label or x["id"] == label for x in list_resp.json())


def test_add_and_remove_student_to_etablissement() -> None:
    """Verify enrolling and detaching a student from an establishment."""
    # Enroll student 'ahmed' into ESPRIT or Sesame
    response = client.post(
        "/api/etablissements/Sesame/students",
        json={"student_id": "ahmed"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    # Check that Sesame now lists ahmed
    get_resp = client.get("/api/etablissements/Sesame")
    assert get_resp.status_code == 200
    etab_data = get_resp.json()
    student_ids = [s["id"] for s in etab_data["etudiants_inscrits"]]
    assert "ahmed" in student_ids

    # Remove student
    del_resp = client.delete("/api/etablissements/Sesame/students/ahmed")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True


def test_add_and_remove_formation_to_etablissement() -> None:
    """Verify linking and detaching a formation from an establishment."""
    response = client.post(
        "/api/etablissements/Sesame/formations",
        json={"formation_id": "Formation_Java"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify that Sesame lists Formation_Java
    get_resp = client.get("/api/etablissements/Sesame")
    assert get_resp.status_code == 200
    formations = [f["id"] for f in get_resp.json()["formations_organisees"]]
    assert "Formation_Java" in formations

    # Detach formation
    del_resp = client.delete("/api/etablissements/Sesame/formations/Formation_Java")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True


def test_add_and_remove_teacher_to_etablissement() -> None:
    """Verify affiliating and detaching a teacher from an establishment."""
    response = client.post(
        "/api/etablissements/Sesame/teachers",
        json={"teacher_id": "Ali"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify that Sesame lists Ali
    get_resp = client.get("/api/etablissements/Sesame")
    assert get_resp.status_code == 200
    teachers = [t["id"] for t in get_resp.json()["enseignants_affilies"]]
    assert "Ali" in teachers

    # Detach teacher
    del_resp = client.delete("/api/etablissements/Sesame/teachers/Ali")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True



