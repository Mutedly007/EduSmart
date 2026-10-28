"""API tests for Formation CRUD endpoints."""

import asyncio
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient
from rdflib.plugins.sparql.parser import parseQuery, parseUpdate

from app.api.routes.formations import formation_service
from app.main import app
from app.schemas.formation import FormationCreate, FormationItem, FormationUpdate
from app.services import formation_service as formation_service_module
from app.services.formation_service import FormationService

client = TestClient(app)


def test_list_formations_passes_filters(monkeypatch) -> None:
    get_all = AsyncMock(return_value=[])
    monkeypatch.setattr(formation_service, "get_all", get_all)

    response = client.get("/api/formations", params={"name": "Python", "class_name": "Cours"})

    assert response.status_code == 200
    assert response.json() == []
    get_all.assert_awaited_once_with(name="Python", class_name="Cours")


def test_list_formation_classes(monkeypatch) -> None:
    get_classes = AsyncMock(return_value=[{"class_name": "Type_Formation", "label": "Type Formation"}])
    monkeypatch.setattr(formation_service, "get_classes", get_classes)

    response = client.get("/api/formations/classes")

    assert response.status_code == 200
    assert response.json() == [{"class_name": "Type_Formation", "label": "Type Formation"}]


def test_create_formation_returns_created_record(monkeypatch) -> None:
    create = AsyncMock(return_value={"success": True, "id": "Data_Science"})
    monkeypatch.setattr(formation_service, "create", create)

    response = client.post(
        "/api/formations",
        json={
            "label": "Data Science",
            "class_name": "Formation",
            "duration": 12,
            "price": 99.5,
            "domain": "Informatique",
        },
    )

    assert response.status_code == 201
    assert response.json()["id"] == "Data_Science"
    create.assert_awaited_once()


def test_update_formation_returns_validation_error_for_invalid_class(monkeypatch) -> None:
    update = AsyncMock(side_effect=ValueError("Invalid Formation class name."))
    monkeypatch.setattr(formation_service, "update", update)

    response = client.put("/api/formations/Intro", json={"class_name": "Cours } DELETE WHERE { ?s ?p ?o"})

    assert response.status_code == 422


def test_delete_formation_reports_service_failure(monkeypatch) -> None:
    delete = AsyncMock(return_value={"success": False, "error": "Fuseki unavailable"})
    monkeypatch.setattr(formation_service, "delete", delete)

    response = client.delete("/api/formations/Intro")

    assert response.status_code == 400
    assert response.json()["detail"] == "Fuseki unavailable"


def test_formation_chat_endpoint_rejects_unrecognized_commands() -> None:
    response = client.post("/api/formations/chat", json={"command": "commande inconnue"})

    assert response.status_code == 200
    assert response.json()["success"] is False
    assert response.json()["action"] == "unknown"


def test_create_serializes_literals_and_decimal_as_safe_rdf_terms(monkeypatch) -> None:
    execute_update = AsyncMock(return_value={"success": True, "source": "rdflib_fallback"})
    monkeypatch.setattr(formation_service_module.sparql_service, "execute_update", execute_update)
    service = FormationService()

    asyncio.run(
        service.create(
            FormationCreate(
                label='Formation "avancée"',
                duration="2.5",
                description='A } ; DELETE WHERE { ?s ?p ?o }',
            )
        )
    )

    update = execute_update.await_args.args[0]
    assert 'rdfs:label "Formation \\"avancée\\""' in update
    assert 'edu:description "A } ; DELETE WHERE { ?s ?p ?o }"' in update
    assert '"2.5"^^<http://www.w3.org/2001/XMLSchema#decimal>' in update
    parseUpdate(update)


def test_list_query_includes_root_class_instances(monkeypatch) -> None:
    execute_query = AsyncMock(return_value={"records": []})
    monkeypatch.setattr(formation_service_module.sparql_service, "execute_query", execute_query)
    service = FormationService()

    asyncio.run(service.get_all())

    query = execute_query.await_args.args[0]
    assert "?type rdfs:subClassOf* edu:Formation" in query
    assert "FILTER(?type != edu:Formation)" not in query
    parseQuery(query)


def test_update_builds_valid_multiple_operations_and_clears_fields(monkeypatch) -> None:
    execute_update = AsyncMock(return_value={"success": True})
    monkeypatch.setattr(formation_service_module.sparql_service, "execute_update", execute_update)
    service = FormationService()

    asyncio.run(service.update("Formation_A", FormationUpdate(description=None, price="50")))

    update = execute_update.await_args.args[0]
    assert "PREFIX edu:" in update
    assert "\n;\nDELETE {" in update
    assert "edu:description ?old_value" in update
    assert '"50"^^<http://www.w3.org/2001/XMLSchema#decimal>' in update
    parseUpdate(update)


def test_create_rejects_invalid_class_name_before_update(monkeypatch) -> None:
    execute_update = AsyncMock()
    monkeypatch.setattr(formation_service_module.sparql_service, "execute_update", execute_update)
    service = FormationService()

    try:
        asyncio.run(service.create(FormationCreate(label="Valid label", class_name="Formation> } DELETE")))
    except ValueError as exc:
        assert str(exc) == "Invalid Formation class name."
    else:
        raise AssertionError("Expected invalid class name to be rejected")
    execute_update.assert_not_awaited()


def test_chat_creates_formation_from_french_command(monkeypatch) -> None:
    service = FormationService()
    create = AsyncMock(return_value={"success": True, "id": "Python", "message": "created", "sparql": "INSERT"})
    get_all = AsyncMock(return_value=[])
    monkeypatch.setattr(service, "create", create)
    monkeypatch.setattr(service, "get_all", get_all)

    result = asyncio.run(service.execute_chat_command("Créer une formation nommée Python"))

    assert result["success"] is True
    assert result["action"] == "create"
    create.assert_awaited_once_with(FormationCreate(label="Python"))


def test_chat_updates_numeric_field_for_unique_formation(monkeypatch) -> None:
    service = FormationService()
    formation = FormationItem(
        id="Formation_Java",
        uri="http://example.test#Formation_Java",
        label="Formation Java",
        class_name="Formation",
    )
    get_all = AsyncMock(return_value=[formation])
    update = AsyncMock(return_value={"success": True, "message": "updated", "sparql": "DELETE/INSERT"})
    monkeypatch.setattr(service, "get_all", get_all)
    monkeypatch.setattr(service, "update", update)

    result = asyncio.run(service.execute_chat_command("Modifier le prix de Formation Java à 900"))

    assert result["success"] is True
    assert result["action"] == "update"
    assert result["affected_id"] == "Formation_Java"
    update.assert_awaited_once()
    assert update.await_args.args[0] == "Formation_Java"
    assert update.await_args.args[1] == FormationUpdate(price=900)


def test_chat_refuses_ambiguous_delete_target(monkeypatch) -> None:
    service = FormationService()
    formations = [
        FormationItem(id="Formation_Java", uri="http://example.test#Formation_Java", label="Formation Java", class_name="Formation"),
        FormationItem(id="Cours_Java", uri="http://example.test#Cours_Java", label="Cours Java", class_name="Cours"),
    ]
    monkeypatch.setattr(service, "get_all", AsyncMock(return_value=formations))
    delete = AsyncMock()
    monkeypatch.setattr(service, "delete", delete)

    result = asyncio.run(service.execute_chat_command("Supprimer Java"))

    assert result["success"] is False
    assert result["action"] == "delete"
    delete.assert_not_awaited()
