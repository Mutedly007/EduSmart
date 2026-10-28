"""Service for managing Formation individuals in the semantic graph."""

import re
import time
import unicodedata
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

from rdflib import Literal, URIRef
from rdflib.namespace import XSD

from app.schemas.formation import FormationCreate, FormationItem, FormationUpdate
from app.services.sparql_service import sparql_service

EDU_NS = "http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#"
PREFIXES = f"""
PREFIX edu: <{EDU_NS}>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
"""

FORMATION_CLASS_DEFAULTS = [
    "Domaine_Formation",
    "Modalité_Formation",
    "Niveau_Formation",
    "Type_Formation",
]


def _sanitize_id(text: str) -> str:
    """Normalize text into a safe, readable RDF local identifier."""
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    cleaned = re.sub(r"[^\w\s-]", "", normalized).strip()
    return re.sub(r"[\s-]+", "_", cleaned)


def _class_uri(class_name: str) -> str:
    """Build a safe ontology class URI from a local class name."""
    name = class_name.strip()
    if not name or not re.fullmatch(r"[\w-]+", name, flags=re.UNICODE):
        raise ValueError("Invalid Formation class name.")
    return URIRef(EDU_NS + name).n3()


def _individual_uri(local_id: str) -> str:
    safe_id = _sanitize_id(local_id)
    if not safe_id:
        raise ValueError("Invalid Formation identifier.")
    return URIRef(EDU_NS + safe_id).n3()


def _string_literal(value: str) -> str:
    return Literal(value).n3()


def _decimal_literal(value: Decimal) -> str:
    return Literal(value, datatype=XSD.decimal).n3()


class FormationService:
    """CRUD operations for formations and their ontology metadata."""

    async def get_classes(self) -> List[Dict[str, str]]:
        """Return all ontology subclasses under Formation."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?class_name ?label WHERE {{
          ?sub rdfs:subClassOf* edu:Formation .
          BIND(STRAFTER(STR(?sub), "#") AS ?class_name)
          OPTIONAL {{ ?sub rdfs:label ?label }}
          FILTER(?class_name != "" && ?class_name != "Thing" && ?class_name != "Formation")
        }}
        ORDER BY ?class_name
        """
        result = await sparql_service.execute_query(query)
        classes: Dict[str, str] = {}

        for record in result.get("records", []):
            name = record.get("class_name", "").strip()
            if name:
                classes[name] = record.get("label") or name.replace("_", " ")

        for name in FORMATION_CLASS_DEFAULTS:
            classes.setdefault(name, name.replace("_", " "))

        return [
            {"class_name": name, "label": label}
            for name, label in sorted(classes.items(), key=lambda item: item[1].casefold())
        ]

    async def get_all(
        self, name: Optional[str] = None, class_name: Optional[str] = None
    ) -> List[FormationItem]:
        """List Formation individuals with optional name and class filters."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?uri ?label ?class_name ?description ?duration ?objective ?price
                        ?domain ?modality WHERE {{
          ?uri a ?type .
          ?type rdfs:subClassOf* edu:Formation .
          BIND(STRAFTER(STR(?type), "#") AS ?class_name)
          OPTIONAL {{ ?uri rdfs:label ?label }}
          OPTIONAL {{ ?uri edu:description ?description }}
          OPTIONAL {{ ?uri edu:duree ?duration }}
          OPTIONAL {{ ?uri edu:objectif ?objective }}
          OPTIONAL {{ ?uri edu:prix ?price }}
          OPTIONAL {{ ?uri edu:aPourDomaine ?domain }}
          OPTIONAL {{ ?uri edu:utiliseModalite ?modality }}
        }}
        ORDER BY ?class_name ?uri
        """
        result = await sparql_service.execute_query(query)
        items: Dict[str, FormationItem] = {}
        name_filter = name.strip().casefold() if name else None
        class_filter = class_name.strip().casefold() if class_name else None

        for record in result.get("records", []):
            uri = record.get("uri", "")
            if "#" not in uri:
                continue
            item_id = uri.rsplit("#", 1)[-1]
            label = record.get("label") or item_id.replace("_", " ")
            direct_class = record.get("class_name") or "Formation"

            if name_filter and name_filter not in item_id.casefold() and name_filter not in label.casefold():
                continue
            if class_filter and class_filter != "tous" and direct_class.casefold() != class_filter:
                continue
            if item_id in items:
                continue

            items[item_id] = FormationItem(
                id=item_id,
                uri=uri,
                label=label,
                class_name=direct_class,
                description=record.get("description"),
                duration=record.get("duration"),
                objective=record.get("objective"),
                price=record.get("price"),
                domain=record.get("domain_name"),
                modality=record.get("modality_name"),
            )

        return list(items.values())

    async def create(self, data: FormationCreate) -> Dict[str, Any]:
        """Insert a Formation individual using SPARQL 1.1."""
        item_id = _sanitize_id(data.id or data.label) or f"Formation_{int(time.time())}"
        subject = _individual_uri(item_id)
        class_uri = _class_uri(data.class_name.strip() or "Formation")

        triples = [
            f"{subject} a {class_uri}",
            f"{subject} a edu:Formation",
            f"{subject} rdfs:label {_string_literal(data.label)}",
        ]
        for field_name, predicate in (
            ("description", "description"),
            ("objective", "objectif"),
        ):
            value = getattr(data, field_name)
            if value is not None:
                triples.append(f"{subject} edu:{predicate} {_string_literal(value)}")

        for field_name, predicate in (("duration", "duree"), ("price", "prix")):
            value = getattr(data, field_name)
            if value is not None:
                triples.append(f"{subject} edu:{predicate} {_decimal_literal(value)}")

        for field_name, predicate in (("domain", "aPourDomaine"), ("modality", "utiliseModalite")):
            value = getattr(data, field_name)
            if value:
                triples.append(f"{subject} edu:{predicate} {_individual_uri(value)}")

        update = f"{PREFIXES}\nINSERT DATA {{\n  " + " .\n  ".join(triples) + "\n}"
        result = await sparql_service.execute_update(update)
        return {
            "success": result.get("success", False),
            "id": item_id,
            "sparql": update.strip(),
            "message": f"Formation '{data.label}' créée avec succès.",
            "source": result.get("source"),
            "error": result.get("error"),
        }

    async def update(self, item_id: str, data: FormationUpdate) -> Dict[str, Any]:
        """Update supplied Formation fields, clearing explicitly null values."""
        subject = _individual_uri(item_id)
        updates: List[str] = []
        supplied = data.model_fields_set

        if "class_name" in supplied and data.class_name:
            class_uri = _class_uri(data.class_name)
            updates.append(
                f"""DELETE {{ {subject} a ?old_type }}
INSERT {{ {subject} a {class_uri} ; a edu:Formation }}
WHERE {{ OPTIONAL {{ {subject} a ?old_type . FILTER(?old_type != edu:Formation) }} }}"""
            )

        literal_fields = {
            "label": ("rdfs:label", _string_literal),
            "description": ("edu:description", _string_literal),
            "objective": ("edu:objectif", _string_literal),
            "duration": ("edu:duree", _decimal_literal),
            "price": ("edu:prix", _decimal_literal),
        }
        for field_name, (predicate, serialize) in literal_fields.items():
            if field_name not in supplied:
                continue
            value = getattr(data, field_name)
            object_pattern = serialize(value) if value is not None else "?old_value"
            updates.append(
                f"""DELETE {{ {subject} {predicate} ?old_value }}
INSERT {{ {subject} {predicate} {object_pattern} }}
WHERE {{ OPTIONAL {{ {subject} {predicate} ?old_value }} }}"""
                if value is not None
                else f"DELETE WHERE {{ {subject} {predicate} ?old_value }}"
            )

        for field_name, predicate in (
            ("domain", "edu:aPourDomaine"),
            ("modality", "edu:utiliseModalite"),
        ):
            if field_name not in supplied:
                continue
            value = getattr(data, field_name)
            if value:
                object_uri = _individual_uri(value)
                updates.append(
                    f"""DELETE {{ {subject} {predicate} ?old_value }}
INSERT {{ {subject} {predicate} {object_uri} }}
WHERE {{ OPTIONAL {{ {subject} {predicate} ?old_value }} }}"""
                )
            else:
                updates.append(f"DELETE WHERE {{ {subject} {predicate} ?old_value }}")

        if not updates:
            return {
                "success": True,
                "id": _sanitize_id(item_id),
                "sparql": "",
                "message": "Aucun champ modifié.",
            }

        update = PREFIXES + "\n;\n".join(updates)
        result = await sparql_service.execute_update(update)
        return {
            "success": result.get("success", False),
            "id": _sanitize_id(item_id),
            "sparql": update.strip(),
            "message": f"Formation '{_sanitize_id(item_id)}' mise à jour.",
            "source": result.get("source"),
            "error": result.get("error"),
        }

    async def execute_chat_command(self, command: str) -> Dict[str, Any]:
        """Interpret a small, explicit French/English Formation command vocabulary."""
        text = command.strip()
        if not text:
            return self._command_result(False, "unknown", "Saisissez une commande Formation.")

        create_match = re.fullmatch(
            r"(?:cr[eé]er|ajouter|create|add)\s+(?:une?\s+)?"
            r"(?:formation|cours|programme)\s+"
            r"(?:(?:nomm[eé]e?|appel[eé]e?|named|called)\s+)?"
            r"(?P<label>.+)",
            text,
            flags=re.IGNORECASE,
        )
        if create_match:
            label = self._clean_command_value(create_match.group("label"))
            if len(label) < 2:
                return self._command_result(False, "create", "Précisez le nom de la formation.")
            result = await self.create(FormationCreate(label=label))
            return self._command_result(
                result["success"],
                "create",
                result["message"] if result["success"] else result.get("error", result["message"]),
                sparql=result.get("sparql"),
                affected_id=result.get("id"),
                records=await self._command_records(),
            )

        delete_match = re.fullmatch(
            r"(?:supprimer|effacer|delete|remove)\s+"
            r"(?:(?:la|le|l['’]|the)\s+)?"
            r"(?:(?:formation|cours|programme)\s+)?"
            r"(?P<target>.+)",
            text,
            flags=re.IGNORECASE,
        )
        if delete_match:
            target = self._clean_command_value(delete_match.group("target"))
            found = await self._find_command_target(target)
            if found is None:
                return self._command_result(
                    False,
                    "delete",
                    f"Aucune formation ne correspond précisément à « {target} ».",
                )
            result = await self.delete(found.id)
            return self._command_result(
                result["success"],
                "delete",
                result["message"] if result["success"] else result.get("error", result["message"]),
                sparql=result.get("sparql"),
                affected_id=found.id,
                records=await self._command_records(),
            )

        update_match = re.fullmatch(
            r"(?:modifier|changer|mettre\s+[aà]\s+jour|update|change)\s+"
            r"(?:(?:le|la)\s+|l['’])?"
            r"(?P<property>nom|name|label|description|objectif|dur[eé]e|duration|prix|price|"
            r"domaine|domain|modalit[eé]|modality|classe|class|type)\s+"
            r"(?:de\s+|d['’]|for\s+|of\s+)"
            r"(?P<target>.+?)\s+(?:[aà]|en|vers|to|as|=)\s+(?P<value>.+)",
            text,
            flags=re.IGNORECASE,
        )
        rename_match = re.fullmatch(
            r"(?:renommer|rename)\s+(?:(?:la|le)\s+)?"
            r"(?:formation|cours|programme)\s+(?P<target>.+?)\s+(?:en|vers|to|as)\s+(?P<value>.+)",
            text,
            flags=re.IGNORECASE,
        )
        if update_match or rename_match:
            match = update_match or rename_match
            assert match is not None
            target = self._clean_command_value(match.group("target"))
            value = self._clean_command_value(match.group("value"))
            found = await self._find_command_target(target)
            if found is None:
                return self._command_result(
                    False,
                    "update",
                    f"Aucune formation ne correspond précisément à « {target} ».",
                )

            property_name = "label" if rename_match else self._normalize_command_property(match.group("property"))
            try:
                update_data = self._command_update(property_name, value)
                result = await self.update(found.id, update_data)
            except (ValueError, TypeError) as exc:
                return self._command_result(False, "update", str(exc), affected_id=found.id)

            return self._command_result(
                result["success"],
                "update",
                result["message"] if result["success"] else result.get("error", result["message"]),
                sparql=result.get("sparql"),
                affected_id=found.id,
                records=await self._command_records(),
            )

        normalized = self._normalize_command(text)
        if re.search(r"\b(lister|liste|afficher|montre|show|list|display)\b", normalized):
            items = await self.get_all()
            return self._command_result(
                True,
                "list",
                f"{len(items)} formation(s) trouvée(s).",
                sparql=(
                    f"{PREFIXES}\nSELECT DISTINCT ?uri ?label WHERE {{ "
                    "?uri a ?type . ?type rdfs:subClassOf* edu:Formation . "
                    "OPTIONAL { ?uri rdfs:label ?label } }"
                ),
                records=self._serialize_command_records(items),
            )

        return self._command_result(
            False,
            "unknown",
            "Commande non reconnue. Exemples : « lister les formations », "
            "« créer une formation nommée Python », « modifier le prix de Formation Java à 900 ».",
        )

    async def _find_command_target(self, target: str) -> Optional[FormationItem]:
        """Resolve only a unique exact or partial identifier/name to avoid unintended writes."""
        items = await self.get_all()
        normalized_target = self._normalize_command(target)
        exact = [
            item
            for item in items
            if normalized_target in {
                self._normalize_command(item.id),
                self._normalize_command(item.label),
            }
        ]
        if len(exact) == 1:
            return exact[0]
        if exact:
            return None

        partial = [
            item
            for item in items
            if normalized_target
            and (
                normalized_target in self._normalize_command(item.id)
                or normalized_target in self._normalize_command(item.label)
            )
        ]
        return partial[0] if len(partial) == 1 else None

    async def _command_records(self) -> List[Dict[str, Any]]:
        return self._serialize_command_records(await self.get_all())

    @staticmethod
    def _serialize_command_records(items: List[FormationItem]) -> List[Dict[str, Any]]:
        return [item.model_dump(mode="json") for item in items]

    @staticmethod
    def _command_result(
        success: bool,
        action: str,
        message: str,
        *,
        sparql: Optional[str] = None,
        affected_id: Optional[str] = None,
        records: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        return {
            "success": success,
            "action": action,
            "message": message,
            "sparql": sparql,
            "affected_id": affected_id,
            "records": records,
        }

    @staticmethod
    def _clean_command_value(value: str) -> str:
        return value.strip().strip("\"'“”‘’").strip()

    @staticmethod
    def _normalize_command(value: str) -> str:
        normalized = unicodedata.normalize("NFKD", value.casefold())
        return "".join(char for char in normalized if not unicodedata.combining(char)).strip()

    @classmethod
    def _normalize_command_property(cls, value: str) -> str:
        normalized = cls._normalize_command(value)
        aliases = {
            "nom": "label",
            "name": "label",
            "label": "label",
            "description": "description",
            "objectif": "objective",
            "duree": "duration",
            "duration": "duration",
            "prix": "price",
            "price": "price",
            "domaine": "domain",
            "domain": "domain",
            "modalite": "modality",
            "modality": "modality",
            "classe": "class_name",
            "class": "class_name",
            "type": "class_name",
        }
        return aliases[normalized]

    @staticmethod
    def _command_update(property_name: str, value: str) -> FormationUpdate:
        if property_name in {"duration", "price"}:
            try:
                numeric_value = Decimal(value.replace(",", "."))
            except (InvalidOperation, ValueError) as exc:
                raise ValueError("La durée et le prix doivent être numériques.") from exc
            if not numeric_value.is_finite() or numeric_value < 0:
                raise ValueError("La durée et le prix doivent être positifs ou nuls.")
            return FormationUpdate(**{property_name: numeric_value})
        return FormationUpdate(**{property_name: value})

    async def delete(self, item_id: str) -> Dict[str, Any]:
        """Delete a Formation individual and all triples that reference it."""
        subject = _individual_uri(item_id)
        update = f"""{PREFIXES}
DELETE WHERE {{ {subject} ?predicate ?object }} ;
DELETE WHERE {{ ?source ?predicate {subject} }}
"""
        result = await sparql_service.execute_update(update)
        return {
            "success": result.get("success", False),
            "id": _sanitize_id(item_id),
            "sparql": update.strip(),
            "message": f"Formation '{_sanitize_id(item_id)}' supprimée du triplestore.",
            "source": result.get("source"),
            "error": result.get("error"),
        }


formation_service = FormationService()
