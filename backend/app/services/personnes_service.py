"""Service for managing the Personnes branch (CRUD & NLP commands).

Executes W3C SPARQL 1.1 queries and updates against Apache Jena Fuseki.
"""

import logging
import re
import time
import unicodedata
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.schemas.personne import PersonneCreate, PersonneItem, PersonneUpdate
from app.services.sparql_service import sparql_service

logger = logging.getLogger("edusmart.personnes")

PREFIXES = """
PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
"""


def _sanitize_id(text: str) -> str:
    """Normalize text into a valid SPARQL individual URI fragment."""
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    cleaned = re.sub(r"[^\w\s-]", "", normalized).strip()
    return re.sub(r"[\s-]+", "_", cleaned)


class PersonnesService:
    """Service to handle CRUD and natural language interactions for the Personnes branch."""

    async def get_classes(self) -> List[Dict[str, str]]:
        """Return all subclasses under edu:Personnes for dropdown selection."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?class_name ?label WHERE {{
          ?sub rdfs:subClassOf* edu:Personnes .
          BIND(STRAFTER(STR(?sub), "#") AS ?class_name)
          OPTIONAL {{ ?sub rdfs:label ?label }}
          FILTER(?class_name != "" && ?class_name != "Thing" && ?class_name != "Personnes")
        }}
        ORDER BY ?class_name
        """
        res = await sparql_service.execute_query(query)
        classes = []
        # Add primary standard classes first if not returned
        defaults = ["Enseignant", "Etudiant", "Professeur", "Personnel_Administratif", "Chercheur"]
        seen = set()

        for rec in res.get("records", []):
            c_name = rec.get("class_name", "").strip()
            if c_name and c_name not in seen:
                seen.add(c_name)
                classes.append({
                    "class_name": c_name,
                    "label": rec.get("label") or c_name.replace("_", " "),
                })

        for d in defaults:
            if d not in seen:
                seen.add(d)
                classes.append({"class_name": d, "label": d.replace("_", " ")})

        classes.sort(key=lambda x: x["label"])
        return classes

    async def get_all(
        self, name: Optional[str] = None, class_name: Optional[str] = None
    ) -> List[PersonneItem]:
        """Fetch all individuals belonging to Personnes or its subclasses."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?uri ?label ?class_name ?email ?telephone ?grade ?specialite ?statut ?nomProp WHERE {{
          ?uri a ?type .
          ?type rdfs:subClassOf* edu:Personnes .
          BIND(STRAFTER(STR(?type), "#") AS ?class_name)
          FILTER(?class_name != "Thing" && ?class_name != "Personnes")
          OPTIONAL {{ ?uri rdfs:label ?label }}
          OPTIONAL {{ ?uri edu:nom ?nomProp }}
          OPTIONAL {{ ?uri edu:email ?email }}
          OPTIONAL {{ ?uri edu:telephone ?telephone }}
          OPTIONAL {{ ?uri edu:grade ?grade }}
          OPTIONAL {{ ?uri edu:specialite ?specialite }}
          OPTIONAL {{ ?uri edu:statut ?statut }}
        }}
        ORDER BY ?class_name ?uri
        """
        res = await sparql_service.execute_query(query)
        items_map: Dict[str, PersonneItem] = {}

        for rec in res.get("records", []):
            uri = rec.get("uri", "")
            if not uri or "#" not in uri:
                continue
            ind_id = uri.split("#")[-1]

            label = rec.get("label") or rec.get("nomProp") or ind_id.replace("_", " ")
            c_name = rec.get("class_name") or "Personnes"

            # Filter in Python for robust case-insensitive matching
            if name:
                search_term = name.strip().lower()
                if search_term not in ind_id.lower() and search_term not in label.lower():
                    continue

            if class_name and class_name.strip() and class_name.strip() != "Tous":
                if c_name.lower() != class_name.strip().lower():
                    continue

            if ind_id not in items_map:
                items_map[ind_id] = PersonneItem(
                    id=ind_id,
                    uri=uri,
                    label=label,
                    class_name=c_name,
                    email=rec.get("email"),
                    telephone=rec.get("telephone"),
                    grade=rec.get("grade"),
                    specialite=rec.get("specialite"),
                    statut=rec.get("statut"),
                )

        return list(items_map.values())

    async def create(self, data: PersonneCreate) -> Dict[str, Any]:
        """Create a new individual in the Personnes branch using SPARQL 1.1 INSERT DATA."""
        ind_id = _sanitize_id(data.id) if data.id else _sanitize_id(data.label)
        if not ind_id:
            ind_id = "Personne_" + str(int(time.time()))

        c_name = data.class_name.strip() or "Etudiant"
        label_clean = data.label.replace('"', '\\"')

        props = []
        if data.email:
            props.append(f'edu:email "{data.email.strip()}"')
        if data.telephone:
            props.append(f'edu:telephone "{data.telephone.strip()}"')
        if data.grade:
            props.append(f'edu:grade "{data.grade.strip()}"')
        if data.specialite:
            props.append(f'edu:specialite "{data.specialite.strip()}"')

        props_str = " ;\n    ".join(props)
        if props_str:
            props_str = " ;\n    " + props_str

        sparql_update = f"""{PREFIXES}
INSERT DATA {{
  edu:{ind_id} a edu:{c_name} ;
    a edu:Personnes ;
    rdfs:label "{label_clean}" ;
    edu:nom "{label_clean}"{props_str} .
}}
"""
        update_res = await sparql_service.execute_update(sparql_update)
        return {
            "success": update_res.get("success", False),
            "id": ind_id,
            "sparql": sparql_update.strip(),
            "message": f"Individu '{data.label}' (classe: {c_name}) créé avec succès.",
            "source": update_res.get("source"),
            "error": update_res.get("error"),
        }

    async def update(self, ind_id: str, data: PersonneUpdate) -> Dict[str, Any]:
        """Update an existing Personne individual using SPARQL 1.1 DELETE/INSERT."""
        safe_id = _sanitize_id(ind_id)
        sparql_parts = []

        if data.label:
            lbl = data.label.replace('"', '\\"')
            sparql_parts.append(
                f"""DELETE {{ edu:{safe_id} rdfs:label ?o . edu:{safe_id} edu:nom ?n }}
                INSERT {{ edu:{safe_id} rdfs:label "{lbl}" . edu:{safe_id} edu:nom "{lbl}" }}
                WHERE {{ OPTIONAL {{ edu:{safe_id} rdfs:label ?o }} OPTIONAL {{ edu:{safe_id} edu:nom ?n }} }}"""
            )

        if data.class_name:
            sparql_parts.append(
                f"""DELETE {{ edu:{safe_id} a ?t }}
                INSERT {{ edu:{safe_id} a edu:{data.class_name.strip()} . edu:{safe_id} a edu:Personnes }}
                WHERE {{ edu:{safe_id} a ?t . FILTER(?t != edu:Personnes) }}"""
            )

        if data.email is not None:
            sparql_parts.append(
                f"""DELETE {{ edu:{safe_id} edu:email ?e }}
                INSERT {{ edu:{safe_id} edu:email "{data.email.strip()}" }}
                WHERE {{ OPTIONAL {{ edu:{safe_id} edu:email ?e }} }}"""
            )

        if data.telephone is not None:
            sparql_parts.append(
                f"""DELETE {{ edu:{safe_id} edu:telephone ?t }}
                INSERT {{ edu:{safe_id} edu:telephone "{data.telephone.strip()}" }}
                WHERE {{ OPTIONAL {{ edu:{safe_id} edu:telephone ?t }} }}"""
            )

        if not sparql_parts:
            return {"success": True, "message": "Aucun champ modifié.", "sparql": ""}

        full_sparql = PREFIXES + " ;\n".join(sparql_parts)
        res = await sparql_service.execute_update(full_sparql)
        return {
            "success": res.get("success", False),
            "id": safe_id,
            "sparql": full_sparql.strip(),
            "message": f"Individu '{safe_id}' mis à jour avec succès.",
            "error": res.get("error"),
        }

    async def delete(self, ind_id: str) -> Dict[str, Any]:
        """Delete an individual and all its triples using SPARQL 1.1 DELETE WHERE."""
        safe_id = _sanitize_id(ind_id)
        sparql_delete = f"""{PREFIXES}
DELETE WHERE {{ edu:{safe_id} ?p ?o }} ;
DELETE WHERE {{ ?s ?p edu:{safe_id} }}
"""
        res = await sparql_service.execute_update(sparql_delete)
        return {
            "success": res.get("success", False),
            "id": safe_id,
            "sparql": sparql_delete.strip(),
            "message": f"Individu '{safe_id}' supprimé avec succès du triplestore.",
            "error": res.get("error"),
        }

    async def execute_chat_command(self, command: str) -> Dict[str, Any]:
        """Parse natural language command and execute the corresponding Personnes CRUD action."""
        cmd = command.strip()
        cmd_lower = cmd.lower()

        # 1. CREATE COMMAND: e.g. "créer un étudiant nommé Yassine Ben Ali", "ajouter enseignant Sami"
        create_match = re.search(
            r"\b(cr[eé]er|ajouter|add|create|nouveau)\b\s+(un\s+|une\s+|an?\s+)?(?P<type>[a-z_à-ÿ]+)\s+(nomm[eé]\s+|named\s+|appel[eé]\s+|:)?\s*(?P<name>.+)",
            cmd_lower,
            re.IGNORECASE,
        )

        if create_match:
            raw_type = create_match.group("type").strip()
            raw_name = create_match.group("name").strip()

            # Clean name from quotes
            name_clean = re.sub(r'["\']', '', raw_name).strip()
            name_clean = " ".join(w.capitalize() for w in name_clean.split())

            # Map type to ontology class
            c_name = "Etudiant"
            if any(k in raw_type for k in ["prof", "enseignant", "teacher", "instructor"]):
                c_name = "Professeur" if "prof" in raw_type else "Enseignant"
            elif any(k in raw_type for k in ["admin", "direction", "secretaire"]):
                c_name = "Personnel_Administratif"
            elif any(k in raw_type for k in ["chercheur", "doctorant"]):
                c_name = "Chercheur"

            create_data = PersonneCreate(
                label=name_clean,
                class_name=c_name,
            )
            result = await self.create(create_data)
            all_items = await self.get_all()
            return {
                "success": result["success"],
                "action": "create",
                "message": f"L'individu '{name_clean}' de type '{c_name}' a été créé dans Fuseki via SPARQL INSERT.",
                "sparql": result["sparql"],
                "affected_id": result["id"],
                "records": [item.dict() for item in all_items],
            }

        # 2. DELETE COMMAND: e.g. "supprimer l'étudiant Yassine", "delete person Ali"
        delete_match = re.search(
            r"\b(supprimer|effacer|delete|remove)\b\s+(l['\s]|la\s+|le\s+|the\s+)?(personne|etudiant|enseignant|individu)?\s*(?P<name>.+)",
            cmd_lower,
            re.IGNORECASE,
        )

        if delete_match:
            raw_name = delete_match.group("name").strip()
            name_clean = re.sub(r'["\']', '', raw_name).strip()
            name_clean = re.sub(r"^(l['\s]|la\s+|le\s+|the\s+)?(personne|etudiant|étudiant|enseignant|professeur|prof|chercheur|individu)\s+", "", name_clean, flags=re.IGNORECASE).strip()
            target_id = _sanitize_id(name_clean)

            # Try finding matching individual
            current = await self.get_all()
            found = next(
                (item for item in current if item.id.lower() == target_id.lower() or item.label.lower() == name_clean.lower() or name_clean.lower() in item.label.lower() or name_clean.lower() in item.id.lower()),
                None,
            )
            actual_id = found.id if found else target_id

            del_res = await self.delete(actual_id)
            all_items = await self.get_all()
            return {
                "success": del_res["success"],
                "action": "delete",
                "message": f"L'individu '{actual_id}' a été supprimé de Fuseki via SPARQL DELETE.",
                "sparql": del_res["sparql"],
                "affected_id": actual_id,
                "records": [item.dict() for item in all_items],
            }

        # 3. LIST COMMAND: e.g. "lister les enseignants", "show all students"
        if any(k in cmd_lower for k in ["lister", "liste", "show", "afficher", "quels sont", "tous les", "toutes les"]):
            target_cls = None
            if any(k in cmd_lower for k in ["enseignant", "prof", "teacher"]):
                target_cls = "Enseignant"
            elif any(k in cmd_lower for k in ["etudiant", "student"]):
                target_cls = "Etudiant"

            items = await self.get_all(class_name=target_cls)
            return {
                "success": True,
                "action": "list",
                "message": f"{len(items)} personnes trouvées dans l'ontologie.",
                "sparql": f"{PREFIXES}\nSELECT ?ind ?label ?type WHERE {{ ?ind a ?type . ?type rdfs:subClassOf* edu:Personnes }}",
                "affected_id": None,
                "records": [item.dict() for item in items],
            }

        # Unknown command fallback
        return {
            "success": False,
            "action": "unknown",
            "message": "Commande non reconnue. Essayez par exemple : 'Créer un étudiant nommé Yassine Ben Ali' ou 'Supprimer la personne Ali'.",
            "sparql": None,
            "affected_id": None,
            "records": None,
        }


personnes_service = PersonnesService()
