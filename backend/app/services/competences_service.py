"""Service for managing the Compétence branch (CRUD & NLP commands).

Executes W3C SPARQL 1.1 queries and updates against Apache Jena Fuseki with local RDFLib fallback.
"""

import logging
import re
import time
import unicodedata
from typing import Any, Dict, List, Optional, Set

from app.schemas.competence import (
    CompetenceClassItem,
    CompetenceCreate,
    CompetenceItem,
    CompetenceUpdate,
)
from app.services.sparql_service import sparql_service

logger = logging.getLogger("edusmart.competences")

PREFIXES = """
PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
"""


def _sanitize_id(text: str) -> str:
    """Normalize text into a valid SPARQL individual URI fragment."""
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    cleaned = re.sub(r"[^\w\s-]", "", normalized).strip()
    return re.sub(r"[\s-]+", "_", cleaned)


def _determine_category(class_name: str, parent_name: Optional[str] = None) -> str:
    """Deduce high-level category (Technique, Transversale, Linguistique) from class name and ancestry."""
    text = f"{class_name} {parent_name or ''}".lower()
    if any(k in text for k in ["langue", "anglais", "francais", "français", "comprehension", "compréhension", "expression", "redaction", "rédaction", "linguistique"]):
        return "Linguistique"
    if any(k in text for k in ["transversale", "collaboration", "communication", "conflit", "equipe", "équipe", "ecoute", "écoute", "organisation", "projet", "temps"]):
        return "Transversale"
    return "Technique"


class CompetencesService:
    """Service to handle CRUD and natural language interactions for the Compétence branch."""

    async def get_classes(self) -> List[CompetenceClassItem]:
        """Return all subclasses under edu:Compétence with category & parent."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?class_name ?label ?parent_name WHERE {{
          ?sub rdfs:subClassOf* edu:Compétence .
          BIND(STRAFTER(STR(?sub), "#") AS ?class_name)
          OPTIONAL {{ ?sub rdfs:label ?label }}
          OPTIONAL {{
            ?sub rdfs:subClassOf ?parent .
            FILTER(?parent != owl:Thing)
            BIND(STRAFTER(STR(?parent), "#") AS ?parent_name)
          }}
          FILTER(?class_name != "" && ?class_name != "Thing" && ?class_name != "Compétence")
        }}
        ORDER BY ?class_name
        """
        res = await sparql_service.execute_query(query)
        classes_map: Dict[str, CompetenceClassItem] = {}

        # Default fallback standard classes if triplestore is blank
        defaults = [
            ("Programmation", "Programmation", "Technique", "Informatique"),
            ("SQL", "SQL", "Technique", "Base_De_Données"),
            ("Cybersécurité", "Cybersécurité", "Technique", "Compétence_Technique"),
            ("Réseaux", "Réseaux", "Technique", "Compétence_Technique"),
            ("Anglais_Technique", "Anglais Technique", "Linguistique", "Anglais"),
            ("Français", "Français", "Linguistique", "Langues"),
            ("Gestion_Projet", "Gestion de Projet", "Transversale", "Organisation"),
            ("Communication", "Communication", "Transversale", "Compétence_Transversale"),
            ("Travail_Equipe", "Travail en Équipe", "Transversale", "Collaboration"),
        ]

        for rec in res.get("records", []):
            c_name = rec.get("class_name", "").strip()
            if not c_name or c_name in ("Compétence", "Thing"):
                continue
            parent = rec.get("parent_name")
            category = _determine_category(c_name, parent)
            lbl = rec.get("label") or c_name.replace("_", " ")

            if c_name not in classes_map:
                classes_map[c_name] = CompetenceClassItem(
                    class_name=c_name,
                    label=lbl,
                    category=category,
                    parent=parent,
                )

        for c_name, lbl, cat, par in defaults:
            if c_name not in classes_map:
                classes_map[c_name] = CompetenceClassItem(
                    class_name=c_name,
                    label=lbl,
                    category=cat,
                    parent=par,
                )

        result_list = list(classes_map.values())
        result_list.sort(key=lambda x: (x.category or "", x.label or x.class_name))
        return result_list

    async def get_all(
        self,
        name: Optional[str] = None,
        class_name: Optional[str] = None,
        niveau: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[CompetenceItem]:
        """Fetch all individuals belonging to Compétence or its subclasses, with properties & relations."""
        # 1. Fetch competence individuals and properties
        query = f"""{PREFIXES}
        SELECT DISTINCT ?uri ?label ?class_name ?description ?niveau ?langue ?nomProp WHERE {{
          ?uri a ?type .
          ?type rdfs:subClassOf* edu:Compétence .
          BIND(STRAFTER(STR(?type), "#") AS ?class_name)
          FILTER(?class_name != "Thing" && ?class_name != "Compétence")
          OPTIONAL {{ ?uri rdfs:label ?label }}
          OPTIONAL {{ ?uri edu:nom ?nomProp }}
          OPTIONAL {{ ?uri edu:description ?description }}
          OPTIONAL {{ ?uri edu:niveau ?niveau }}
          OPTIONAL {{ ?uri edu:langue ?langue }}
        }}
        ORDER BY ?class_name ?uri
        """
        res = await sparql_service.execute_query(query)
        items_map: Dict[str, CompetenceItem] = {}

        for rec in res.get("records", []):
            uri = rec.get("uri", "")
            if not uri or "#" not in uri:
                continue
            ind_id = uri.split("#")[-1]

            label = rec.get("label") or rec.get("nomProp") or ind_id.replace("_", " ")
            c_name = rec.get("class_name") or "Compétence"
            cat = _determine_category(c_name)
            desc = rec.get("description")
            niv = rec.get("niveau") or "Intermédiaire"
            lang = rec.get("langue")

            # Filters
            if name:
                search_term = name.strip().lower()
                if (
                    search_term not in ind_id.lower()
                    and search_term not in label.lower()
                    and (not desc or search_term not in desc.lower())
                ):
                    continue

            if class_name and class_name.strip() and class_name.strip() != "Tous":
                if c_name.lower() != class_name.strip().lower():
                    continue

            if niveau and niveau.strip() and niveau.strip() != "Tous":
                if niv.lower() != niveau.strip().lower():
                    continue

            if category and category.strip() and category.strip() != "Tous":
                if cat.lower() != category.strip().lower():
                    continue

            if ind_id not in items_map:
                items_map[ind_id] = CompetenceItem(
                    id=ind_id,
                    uri=uri,
                    label=label,
                    class_name=c_name,
                    category=cat,
                    description=desc,
                    niveau=niv,
                    langue=lang,
                    prerequis_pour=[],
                    developpee_par=[],
                    acquise_par=[],
                )

        # 2. Fetch cross-relations for contextual enrichment
        if items_map:
            rel_query = f"""{PREFIXES}
            SELECT DISTINCT ?comp ?coursPrereq ?coursDev ?etudiant WHERE {{
              {{
                ?c1 edu:aPourPrerequis ?comp .
                BIND(STRAFTER(STR(?c1), "#") AS ?coursPrereq)
              }}
              UNION
              {{
                ?c2 edu:développe ?comp .
                BIND(STRAFTER(STR(?c2), "#") AS ?coursDev)
              }}
              UNION
              {{
                ?e edu:acquiert ?comp .
                BIND(STRAFTER(STR(?e), "#") AS ?etudiant)
              }}
            }}
            """
            rel_res = await sparql_service.execute_query(rel_query)
            for rec in rel_res.get("records", []):
                comp_uri = rec.get("comp", "")
                if "#" in comp_uri:
                    c_id = comp_uri.split("#")[-1]
                    if c_id in items_map:
                        item = items_map[c_id]
                        if rec.get("coursPrereq") and rec["coursPrereq"] not in item.prerequis_pour:
                            item.prerequis_pour.append(rec["coursPrereq"])
                        if rec.get("coursDev") and rec["coursDev"] not in item.developpee_par:
                            item.developpee_par.append(rec["coursDev"])
                        if rec.get("etudiant") and rec["etudiant"] not in item.acquise_par:
                            item.acquise_par.append(rec["etudiant"])

        return list(items_map.values())

    async def create(self, data: CompetenceCreate) -> Dict[str, Any]:
        """Create a new individual in the Compétence branch using SPARQL 1.1 INSERT DATA."""
        ind_id = _sanitize_id(data.id) if data.id else _sanitize_id(data.label)
        if not ind_id:
            ind_id = "Competence_" + str(int(time.time()))

        c_name = data.class_name.strip() or "Programmation"
        label_clean = data.label.replace('"', '\\"')
        niveau_clean = (data.niveau or "Intermédiaire").strip()

        props = [
            f'rdfs:label "{label_clean}"',
            f'edu:nom "{label_clean}"',
            f'edu:niveau "{niveau_clean}"',
        ]
        if data.description:
            desc_clean = data.description.strip().replace('"', '\\"')
            props.append(f'edu:description "{desc_clean}"')
        if data.langue:
            lang_clean = data.langue.strip().replace('"', '\\"')
            props.append(f'edu:langue "{lang_clean}"')

        props_str = " ;\n    ".join(props)

        sparql_update = f"""{PREFIXES}
INSERT DATA {{
  edu:{ind_id} a edu:{c_name} ;
    a edu:Compétence ;
    {props_str} .
}}
"""
        update_res = await sparql_service.execute_update(sparql_update)
        return {
            "success": update_res.get("success", False),
            "id": ind_id,
            "sparql": sparql_update.strip(),
            "message": f"Compétence '{data.label}' (classe: {c_name}, niveau: {niveau_clean}) créée avec succès.",
            "source": update_res.get("source"),
            "error": update_res.get("error"),
        }

    async def update(self, ind_id: str, data: CompetenceUpdate) -> Dict[str, Any]:
        """Update an existing Compétence individual using SPARQL 1.1 DELETE/INSERT."""
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
            c_clean = data.class_name.strip()
            sparql_parts.append(
                f"""DELETE {{ edu:{safe_id} a ?t }}
                INSERT {{ edu:{safe_id} a edu:{c_clean} . edu:{safe_id} a edu:Compétence }}
                WHERE {{ edu:{safe_id} a ?t . FILTER(?t != edu:Compétence) }}"""
            )

        if data.description is not None:
            desc_clean = data.description.strip().replace('"', '\\"')
            sparql_parts.append(
                f"""DELETE {{ edu:{safe_id} edu:description ?d }}
                INSERT {{ edu:{safe_id} edu:description "{desc_clean}" }}
                WHERE {{ OPTIONAL {{ edu:{safe_id} edu:description ?d }} }}"""
            )

        if data.niveau is not None:
            niv_clean = data.niveau.strip()
            sparql_parts.append(
                f"""DELETE {{ edu:{safe_id} edu:niveau ?nv }}
                INSERT {{ edu:{safe_id} edu:niveau "{niv_clean}" }}
                WHERE {{ OPTIONAL {{ edu:{safe_id} edu:niveau ?nv }} }}"""
            )

        if data.langue is not None:
            lang_clean = data.langue.strip().replace('"', '\\"')
            sparql_parts.append(
                f"""DELETE {{ edu:{safe_id} edu:langue ?l }}
                INSERT {{ edu:{safe_id} edu:langue "{lang_clean}" }}
                WHERE {{ OPTIONAL {{ edu:{safe_id} edu:langue ?l }} }}"""
            )

        if not sparql_parts:
            return {"success": True, "message": "Aucun champ modifié.", "sparql": ""}

        full_sparql = PREFIXES + " ;\n".join(sparql_parts)
        res = await sparql_service.execute_update(full_sparql)
        return {
            "success": res.get("success", False),
            "id": safe_id,
            "sparql": full_sparql.strip(),
            "message": f"Compétence '{safe_id}' mise à jour avec succès.",
            "error": res.get("error"),
        }

    async def delete(self, ind_id: str) -> Dict[str, Any]:
        """Delete a competence individual and all connected triples using SPARQL 1.1 DELETE WHERE."""
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
            "message": f"Compétence '{safe_id}' supprimée avec succès du triplestore.",
            "error": res.get("error"),
        }

    async def execute_chat_command(self, command: str) -> Dict[str, Any]:
        """Parse natural language command and execute the corresponding Compétences CRUD action."""
        cmd = command.strip()
        cmd_lower = cmd.lower()

        # 1. CREATE COMMAND:
        # e.g.: "créer une compétence nommée Machine Learning", "ajouter compétence SQL de niveau Avancé"
        create_match = re.search(
            r"\b(cr[eé]er|ajouter|add|create|nouvelle)\b\s+(une\s+|la\s+|an?\s+)?(comp[eé]tence\s+)?(?P<rest>.+)",
            cmd_lower,
            re.IGNORECASE,
        )

        if create_match and not any(k in cmd_lower for k in ["supprimer", "effacer", "delete", "remove", "modifier", "changer", "update"]):
            rest = create_match.group("rest").strip()

            # Extract niveau if present (e.g. "de niveau Avancé" or "niveau Débutant")
            niv = "Intermédiaire"
            niv_match = re.search(r"\b(de\s+niveau|niveau|level)\s+(?P<niv>d[eé]butant|interm[eé]diaire|avanc[eé]|expert)", rest, re.IGNORECASE)
            if niv_match:
                raw_niv = niv_match.group("niv").lower()
                if "deb" in raw_niv or "déb" in raw_niv:
                    niv = "Débutant"
                elif "avan" in raw_niv:
                    niv = "Avancé"
                elif "exp" in raw_niv:
                    niv = "Expert"
                else:
                    niv = "Intermédiaire"
                rest = re.sub(r"\b(de\s+niveau|niveau|level)\s+(d[eé]butant|interm[eé]diaire|avanc[eé]|expert)", "", rest, flags=re.IGNORECASE).strip()

            # Extract type/class if present (e.g. "de type Programmation" or "classe SQL")
            c_name = "Programmation"
            type_match = re.search(r"\b(de\s+type|type|classe|class)\s+(?P<type>[a-z_0-9à-ÿ]+)", rest, re.IGNORECASE)
            if type_match:
                raw_type = type_match.group("type").strip()
                if any(k in raw_type for k in ["sql", "bd", "base"]):
                    c_name = "SQL"
                elif any(k in raw_type for k in ["secu", "sécu", "cyber"]):
                    c_name = "Cybersécurité"
                elif any(k in raw_type for k in ["reseau", "réseau"]):
                    c_name = "Réseaux"
                elif any(k in raw_type for k in ["anglais"]):
                    c_name = "Anglais_Technique"
                elif any(k in raw_type for k in ["francais", "français"]):
                    c_name = "Français"
                elif any(k in raw_type for k in ["projet"]):
                    c_name = "Gestion_Projet"
                elif any(k in raw_type for k in ["equipe", "équipe"]):
                    c_name = "Travail_Equipe"
                elif any(k in raw_type for k in ["comm"]):
                    c_name = "Communication"
                else:
                    c_name = raw_type.capitalize()
                rest = re.sub(r"\b(de\s+type|type|classe|class)\s+([a-z_0-9à-ÿ]+)", "", rest, flags=re.IGNORECASE).strip()

            # Clean name from "nommée", "appelée", quotes
            name_clean = re.sub(r"\b(nomm[eé]e?|named|appel[eé]e?|:)\b", "", rest, flags=re.IGNORECASE).strip()
            name_clean = re.sub(r'["\']', '', name_clean).strip()
            name_clean = " ".join(w.capitalize() for w in name_clean.split())

            if len(name_clean) >= 2:
                create_data = CompetenceCreate(
                    label=name_clean,
                    class_name=c_name,
                    niveau=niv,
                )
                result = await self.create(create_data)
                all_items = await self.get_all()
                return {
                    "success": result["success"],
                    "action": "create",
                    "message": f"La compétence '{name_clean}' ({c_name}, niveau {niv}) a été insérée dans l'ontologie via SPARQL INSERT.",
                    "sparql": result["sparql"],
                    "affected_id": result["id"],
                    "records": [item.model_dump() for item in all_items],
                }

        # 2. DELETE COMMAND:
        # e.g.: "supprimer la compétence Algorithmique", "effacer competence SQL"
        delete_match = re.search(
            r"\b(supprimer|effacer|delete|remove)\b\s+(la\s+|l['\s]|the\s+)?(comp[eé]tence\s+)?(?P<name>.+)",
            cmd_lower,
            re.IGNORECASE,
        )

        if delete_match:
            raw_name = delete_match.group("name").strip()
            name_clean = re.sub(r'["\']', '', raw_name).strip()
            name_clean = re.sub(r"^(la\s+|l['\s]|une\s+|the\s+)?comp[eé]tence\s+", "", name_clean, flags=re.IGNORECASE).strip()
            target_id = _sanitize_id(name_clean)

            current = await self.get_all()
            found = next(
                (
                    item
                    for item in current
                    if item.id.lower() == target_id.lower()
                    or item.label.lower() == name_clean.lower()
                    or name_clean.lower() in item.label.lower()
                    or name_clean.lower() in item.id.lower()
                ),
                None,
            )
            actual_id = found.id if found else target_id

            del_res = await self.delete(actual_id)
            all_items = await self.get_all()
            return {
                "success": del_res["success"],
                "action": "delete",
                "message": f"La compétence '{actual_id}' a été supprimée de l'ontologie via SPARQL DELETE.",
                "sparql": del_res["sparql"],
                "affected_id": actual_id,
                "records": [item.model_dump() for item in all_items],
            }

        # 3. UPDATE COMMAND:
        # e.g.: "modifier le niveau de Algorithmique à Avancé", "changer la description de Java à ..."
        update_match = re.search(
            r"\b(modifier|changer|mettre [aà] jour|update|change|set)\b\s+(le\s+|la\s+|l['\s])?(?P<prop>niveau|level|description|desc|d[eé]tail|classe|class|type|nom|name|label|langue|language)\b\s+(de\s+|d['\s]|pour\s+|for\s+|of\s+)?(la\s+comp[eé]tence\s+)?(?P<comp>[a-z0-9_à-ÿ\s]+?)\s+(à|[aà]|en|vers|to|=)\s+(?P<value>.+)",
            cmd_lower,
            re.IGNORECASE,
        )

        rename_match = None
        if not update_match:
            rename_match = re.search(
                r"\b(renommer|rename)\b\s+(la\s+comp[eé]tence\s+)?(?P<comp>[a-z0-9_à-ÿ\s]+?)\s+(en|vers|to|as)\s+(?P<value>.+)",
                cmd_lower,
                re.IGNORECASE,
            )

        if update_match:
            raw_prop = update_match.group("prop").strip().lower()
            raw_comp = update_match.group("comp").strip()
            raw_value = update_match.group("value").strip()
        elif rename_match:
            raw_prop = "nom"
            raw_comp = rename_match.group("comp").strip()
            raw_value = rename_match.group("value").strip()
        else:
            raw_prop, raw_comp, raw_value = "", "", ""

        if raw_comp and raw_value:
            value_clean = re.sub(r'["\']', '', raw_value).strip()
            comp_clean = re.sub(r'["\']', '', raw_comp).strip()
            comp_clean = re.sub(r"^(la\s+|l['\s]|une\s+|the\s+)?comp[eé]tence\s+", "", comp_clean, flags=re.IGNORECASE).strip()
            target_id = _sanitize_id(comp_clean)

            current = await self.get_all()
            found = next(
                (
                    item
                    for item in current
                    if item.id.lower() == target_id.lower()
                    or item.label.lower() == comp_clean.lower()
                    or comp_clean.lower() in item.label.lower()
                    or comp_clean.lower() in item.id.lower()
                ),
                None,
            )

            if not found:
                return {
                    "success": False,
                    "action": "update",
                    "message": f"Compétence '{comp_clean}' introuvable dans l'ontologie. Vérifiez l'identifiant.",
                    "sparql": None,
                    "affected_id": None,
                    "records": [item.model_dump() for item in current],
                }

            update_data = CompetenceUpdate()
            prop_normalized = "propriété"

            if any(k in raw_prop for k in ["niveau", "level"]):
                # Normalize niveau
                v_lower = value_clean.lower()
                if "deb" in v_lower or "déb" in v_lower:
                    value_clean = "Débutant"
                elif "avan" in v_lower:
                    value_clean = "Avancé"
                elif "exp" in v_lower:
                    value_clean = "Expert"
                else:
                    value_clean = "Intermédiaire"
                update_data.niveau = value_clean
                prop_normalized = "niveau"
            elif any(k in raw_prop for k in ["desc", "détail", "detail"]):
                update_data.description = value_clean
                prop_normalized = "description"
            elif any(k in raw_prop for k in ["classe", "class", "type"]):
                update_data.class_name = value_clean.capitalize().replace(" ", "_")
                prop_normalized = "classe"
            elif any(k in raw_prop for k in ["nom", "name", "label"]):
                update_data.label = value_clean
                prop_normalized = "titre"
            elif any(k in raw_prop for k in ["langue", "language"]):
                update_data.langue = value_clean
                prop_normalized = "langue"

            res = await self.update(found.id, update_data)
            all_items = await self.get_all()
            return {
                "success": res["success"],
                "action": "update",
                "message": f"Le {prop_normalized} de la compétence '{found.label}' a été mis à jour à '{value_clean}' via SPARQL UPDATE.",
                "sparql": res["sparql"],
                "affected_id": found.id,
                "records": [item.model_dump() for item in all_items],
            }

        # 4. LIST COMMAND:
        # e.g.: "lister les compétences", "afficher les compétences techniques"
        if any(k in cmd_lower for k in ["lister", "liste", "show", "afficher", "quelles sont", "toutes les", "quels sont"]):
            target_cat = None
            if "technique" in cmd_lower:
                target_cat = "Technique"
            elif "transversale" in cmd_lower:
                target_cat = "Transversale"
            elif "linguistique" in cmd_lower:
                target_cat = "Linguistique"

            target_niv = None
            for n in ["débutant", "debutant", "intermédiaire", "intermediaire", "avancé", "avance", "expert"]:
                if n in cmd_lower:
                    if "deb" in n:
                        target_niv = "Débutant"
                    elif "avan" in n:
                        target_niv = "Avancé"
                    elif "exp" in n:
                        target_niv = "Expert"
                    else:
                        target_niv = "Intermédiaire"
                    break

            items = await self.get_all(category=target_cat, niveau=target_niv)
            return {
                "success": True,
                "action": "list",
                "message": f"{len(items)} compétences trouvées dans l'ontologie.",
                "sparql": f"{PREFIXES}\nSELECT ?comp ?label ?type ?niveau WHERE {{\n  ?comp a ?type .\n  ?type rdfs:subClassOf* edu:Compétence .\n}}",
                "affected_id": None,
                "records": [item.model_dump() for item in items],
            }

        # Fallback unknown command
        return {
            "success": False,
            "action": "unknown",
            "message": "Commande non reconnue. Essayez par exemple : 'Créer une compétence nommée Machine Learning de niveau Avancé' ou 'Modifier le niveau de Algorithmique à Expert'.",
            "sparql": None,
            "affected_id": None,
            "records": None,
        }


competences_service = CompetencesService()
