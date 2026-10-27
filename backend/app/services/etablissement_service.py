"""Service for managing the Établissement branch (CRUD, Semantic Hub & TALN commands).

Executes W3C SPARQL 1.1 queries and updates against Apache Jena Fuseki.
"""

import logging
import re
import unicodedata
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.schemas.etablissement import (
    EtablissementClassItem,
    EtablissementCreate,
    EtablissementItem,
    EtablissementRelationItem,
    EtablissementUpdate,
)
from app.services.sparql_service import sparql_service

logger = logging.getLogger("edusmart.etablissements")

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


class EtablissementService:
    """Service handling SPARQL 1.1 operations and TALN processing for Établissements."""

    async def get_classes(self) -> List[EtablissementClassItem]:
        """Return all ontological subclasses under Établissement."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?class_name ?label ?parent_name WHERE {{
          ?sub rdfs:subClassOf* ?etab .
          FILTER(CONTAINS(STR(?etab), "tablissement"))
          BIND(STRAFTER(STR(?sub), "#") AS ?class_name)
          OPTIONAL {{ ?sub rdfs:label ?label }}
          OPTIONAL {{ 
            ?sub rdfs:subClassOf ?parent .
            BIND(STRAFTER(STR(?parent), "#") AS ?parent_name)
          }}
          FILTER(?class_name != "" && ?class_name != "Thing" && ?class_name != "Établissement" && ?class_name != "NamedIndividual")
        }}
        ORDER BY ?class_name
        """
        res = await sparql_service.execute_query(query)
        classes: List[EtablissementClassItem] = []
        seen = set()

        # Preferred curated types for prominent display
        defaults = [
            ("Universite_Privee", "Université Privée", "Type d'établissement"),
            ("Universite_Publique", "Université Publique", "Type d'établissement"),
            ("Universite", "Université", "Type d'établissement"),
            ("Ecole", "École d'Ingénieurs / Commerce", "Type d'établissement"),
            ("Institut", "Institut Supérieur / ISET", "Type d'établissement"),
            ("Centre_Formation", "Centre de Formation Professionnelle", "Type d'établissement"),
            ("Presentiel_Etablissement", "Enseignement Présentiel", "Mode d'enseignement"),
            ("Distance_Etablissement", "Enseignement à Distance", "Mode d'enseignement"),
            ("Hybride_Etablissement", "Enseignement Hybride", "Mode d'enseignement"),
            ("Informatique_Etablissement", "Pôle Informatique & Logiciel", "Domaine"),
            ("Ingenierie_Etablissement", "Pôle Ingénierie & Technologie", "Domaine"),
            ("Gestion_Etablissement", "Pôle Gestion & Management", "Domaine"),
        ]

        for c_id, c_label, c_cat in defaults:
            seen.add(c_id.lower())
            classes.append(EtablissementClassItem(class_name=c_id, label=c_label, category=c_cat))

        for rec in res.get("records", []):
            c_name = rec.get("class_name", "").strip()
            if not c_name or c_name.lower() in seen:
                continue
            seen.add(c_name.lower())
            label = rec.get("label") or c_name.replace("_", " ")
            parent = rec.get("parent_name")
            category = "Sous-classe"
            if "mode" in (parent or "").lower() or "mode" in c_name.lower():
                category = "Mode d'enseignement"
            elif "domaine" in (parent or "").lower() or "domaine" in c_name.lower():
                category = "Domaine d'établissement"
            elif "type" in (parent or "").lower() or "type" in c_name.lower():
                category = "Type d'établissement"

            classes.append(EtablissementClassItem(
                class_name=c_name,
                label=label,
                category=category,
                parent=parent,
            ))

        return classes

    async def get_all(
        self,
        name: Optional[str] = None,
        class_name: Optional[str] = None,
        ville: Optional[str] = None,
        statut: Optional[str] = None,
    ) -> List[EtablissementItem]:
        """Fetch all establishment individuals with their Inter-Branch Semantic Hub connections."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?uri ?label ?class_name ?nomProp ?ville ?adresse ?siteWeb ?telephone ?email ?statut ?description ?modeEnseignement ?domaine WHERE {{
          ?uri a ?type .
          ?type rdfs:subClassOf* ?root .
          FILTER(CONTAINS(STR(?root), "tablissement") && ?type != owl:NamedIndividual)
          BIND(STRAFTER(STR(?type), "#") AS ?class_name)
          FILTER(?class_name != "Thing" && ?class_name != "Établissement" && ?class_name != "NamedIndividual")
          
          OPTIONAL {{ ?uri rdfs:label ?label }}
          OPTIONAL {{ ?uri edu:nom ?nomProp }}
          OPTIONAL {{ ?uri edu:ville ?ville }}
          OPTIONAL {{ ?uri edu:adresse ?adresse }}
          OPTIONAL {{ ?uri edu:siteWeb ?siteWeb }}
          OPTIONAL {{ ?uri edu:telephone ?telephone }}
          OPTIONAL {{ ?uri edu:email ?email }}
          OPTIONAL {{ ?uri edu:statut ?statut }}
          OPTIONAL {{ ?uri edu:description ?description }}
          OPTIONAL {{ ?uri edu:modeEnseignement ?modeEnseignement }}
          OPTIONAL {{ ?uri edu:domaine ?domaine }}
        }}
        ORDER BY ?class_name ?uri
        """
        res = await sparql_service.execute_query(query)
        items_map: Dict[str, EtablissementItem] = {}

        for rec in res.get("records", []):
            uri = rec.get("uri", "")
            if not uri or "#" not in uri:
                continue
            ind_id = uri.split("#")[-1]
            if ind_id in items_map:
                continue

            label = rec.get("label") or rec.get("nomProp") or ind_id.replace("_", " ")
            c_name = rec.get("class_name") or "Etablissement"
            v = rec.get("ville") or ("Ariana" if "esprit" in ind_id.lower() else "Tunis")
            st = rec.get("statut") or ("Privé" if "prive" in c_name.lower() or "esprit" in ind_id.lower() else "Accrédité")

            items_map[ind_id] = EtablissementItem(
                id=ind_id,
                uri=uri,
                label=label,
                class_name=c_name,
                ville=v,
                adresse=rec.get("adresse"),
                site_web=rec.get("siteWeb"),
                telephone=rec.get("telephone"),
                email=rec.get("email"),
                statut=st,
                description=rec.get("description"),
                mode_enseignement=rec.get("modeEnseignement") or "Présentiel & Hybride",
                domaine=rec.get("domaine") or "Informatique & Ingénierie",
                formations_organisees=[],
                programmes_proposes=[],
                etudiants_inscrits=[],
                enseignants_affilies=[],
            )

        # Valeur Ajoutée n°1: Enrichissement Hub Sémantique Inter-Branches
        await self._enrich_semantic_hub(items_map)

        results = list(items_map.values())

        # Filtering logic
        if name:
            nl = name.lower()
            results = [x for x in results if nl in x.label.lower() or nl in x.id.lower()]
        if class_name and class_name != "Tous":
            results = [x for x in results if x.class_name.lower() == class_name.lower() or class_name.lower() in x.class_name.lower()]
        if ville and ville != "Toutes":
            results = [x for x in results if (x.ville or "").lower() == ville.lower()]
        if statut and statut != "Tous":
            results = [x for x in results if (x.statut or "").lower() == statut.lower()]

        return results

    async def _enrich_semantic_hub(self, items_map: Dict[str, EtablissementItem]) -> None:
        """Fetch linked Formations, Programmes, Students and Teachers for each establishment."""
        if not items_map:
            return

        # 1. Formations Organisées (edu:organise)
        q_formations = f"""{PREFIXES}
        SELECT DISTINCT ?etab ?formation ?nomFormation WHERE {{
          ?etab edu:organise ?formation .
          OPTIONAL {{ ?formation edu:nom ?nomFormation }}
          OPTIONAL {{ ?formation rdfs:label ?nomFormation }}
        }}
        """
        res_f = await sparql_service.execute_query(q_formations)
        for rec in res_f.get("records", []):
            etab_uri = rec.get("etab", "")
            f_uri = rec.get("formation", "")
            if "#" in etab_uri and "#" in f_uri:
                etab_id = etab_uri.split("#")[-1]
                f_id = f_uri.split("#")[-1]
                if etab_id in items_map:
                    items_map[etab_id].formations_organisees.append(
                        EtablissementRelationItem(
                            id=f_id,
                            uri=f_uri,
                            label=rec.get("nomFormation") or f_id.replace("_", " "),
                            type_name="Formation",
                        )
                    )

        # 2. Programmes Proposés (edu:propose)
        q_progs = f"""{PREFIXES}
        SELECT DISTINCT ?etab ?programme ?nomProg WHERE {{
          ?etab edu:propose ?programme .
          OPTIONAL {{ ?programme edu:nom ?nomProg }}
          OPTIONAL {{ ?programme rdfs:label ?nomProg }}
        }}
        """
        res_p = await sparql_service.execute_query(q_progs)
        for rec in res_p.get("records", []):
            etab_uri = rec.get("etab", "")
            p_uri = rec.get("programme", "")
            if "#" in etab_uri and "#" in p_uri:
                etab_id = etab_uri.split("#")[-1]
                p_id = p_uri.split("#")[-1]
                if etab_id in items_map:
                    items_map[etab_id].programmes_proposes.append(
                        EtablissementRelationItem(
                            id=p_id,
                            uri=p_uri,
                            label=rec.get("nomProg") or p_id.replace("_", " "),
                            type_name="Programme",
                        )
                    )

        # 3. Étudiants Rattachés (inverse edu:appartientA)
        q_students = f"""{PREFIXES}
        SELECT DISTINCT ?etab ?etudiant ?nomEtudiant ?specialite WHERE {{
          ?etudiant edu:appartientA ?etab .
          OPTIONAL {{ ?etudiant edu:nom ?nomEtudiant }}
          OPTIONAL {{ ?etudiant rdfs:label ?nomEtudiant }}
          OPTIONAL {{ ?etudiant edu:specialite ?specialite }}
        }}
        """
        res_s = await sparql_service.execute_query(q_students)
        for rec in res_s.get("records", []):
            etab_uri = rec.get("etab", "")
            s_uri = rec.get("etudiant", "")
            if "#" in etab_uri and "#" in s_uri:
                etab_id = etab_uri.split("#")[-1]
                s_id = s_uri.split("#")[-1]
                if etab_id in items_map:
                    lbl = rec.get("nomEtudiant") or s_id.replace("_", " ")
                    spec = rec.get("specialite")
                    items_map[etab_id].etudiants_inscrits.append(
                        EtablissementRelationItem(
                            id=s_id,
                            uri=s_uri,
                            label=f"{lbl} ({spec})" if spec else lbl,
                            type_name="Étudiant",
                        )
                    )

        # 4. Enseignants Rattachés (via affiliation ou cours proposé)
        q_teachers = f"""{PREFIXES}
        SELECT DISTINCT ?etab ?ens ?nomEns ?grade WHERE {{
          {{
            ?ens edu:appartientA ?etab .
          }} UNION {{
            ?etab edu:propose ?cours .
            ?cours edu:aPourEnseignant ?ens .
          }} UNION {{
            ?ens edu:enseigne ?cours .
            ?etab edu:propose ?cours .
          }}
          OPTIONAL {{ ?ens edu:nom ?nomEns }}
          OPTIONAL {{ ?ens rdfs:label ?nomEns }}
          OPTIONAL {{ ?ens edu:grade ?grade }}
        }}
        """
        res_t = await sparql_service.execute_query(q_teachers)
        for rec in res_t.get("records", []):
            etab_uri = rec.get("etab", "")
            t_uri = rec.get("ens", "")
            if "#" in etab_uri and "#" in t_uri:
                etab_id = etab_uri.split("#")[-1]
                t_id = t_uri.split("#")[-1]
                if etab_id in items_map:
                    # Avoid duplicates
                    if not any(x.id == t_id for x in items_map[etab_id].enseignants_affilies):
                        lbl = rec.get("nomEns") or t_id.replace("_", " ")
                        gr = rec.get("grade")
                        items_map[etab_id].enseignants_affilies.append(
                            EtablissementRelationItem(
                                id=t_id,
                                uri=t_uri,
                                label=f"{lbl} ({gr})" if gr else lbl,
                                type_name="Enseignant",
                            )
                        )

    async def create(self, data: EtablissementCreate) -> Dict[str, Any]:
        """Create a new establishment individual in Fuseki via SPARQL 1.1 INSERT DATA."""
        target_id = _sanitize_id(data.id) if data.id else _sanitize_id(data.label)
        if not target_id:
            return {"success": False, "error": "Identifiant d'établissement invalide."}

        # Check for duplicate
        check_query = f"""{PREFIXES}
        ASK {{ edu:{target_id} a ?type . }}
        """
        exists = await sparql_service.execute_ask(check_query)
        if exists:
            return {
                "success": False,
                "error": f"L'établissement avec l'identifiant '{target_id}' existe déjà dans le triplestore.",
            }

        c_name = data.class_name or "Universite_Privee"
        triples = [
            f"edu:{target_id} a owl:NamedIndividual , edu:{c_name} .",
            f'edu:{target_id} rdfs:label "{data.label}"@fr .',
            f'edu:{target_id} edu:nom "{data.label}" .',
        ]
        if data.ville:
            triples.append(f'edu:{target_id} edu:ville "{data.ville}" .')
        if data.adresse:
            triples.append(f'edu:{target_id} edu:adresse "{data.adresse}" .')
        if data.site_web:
            triples.append(f'edu:{target_id} edu:siteWeb "{data.site_web}" .')
        if data.telephone:
            triples.append(f'edu:{target_id} edu:telephone "{data.telephone}" .')
        if data.email:
            triples.append(f'edu:{target_id} edu:email "{data.email}" .')
        if data.statut:
            triples.append(f'edu:{target_id} edu:statut "{data.statut}" .')
        if data.description:
            triples.append(f'edu:{target_id} edu:description "{data.description}" .')
        if data.mode_enseignement:
            triples.append(f'edu:{target_id} edu:modeEnseignement "{data.mode_enseignement}" .')
        if data.domaine:
            triples.append(f'edu:{target_id} edu:domaine "{data.domaine}" .')

        insert_sparql = f"""{PREFIXES}
INSERT DATA {{
  {chr(10).join("  " + t for t in triples)}
}}
"""
        res = await sparql_service.execute_update(insert_sparql)
        return {
            "success": res.get("success", False),
            "id": target_id,
            "uri": f"http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#{target_id}",
            "sparql": insert_sparql,
            "error": res.get("error"),
        }

    async def update(self, establishment_id: str, data: EtablissementUpdate) -> Dict[str, Any]:
        """Update an existing establishment in Fuseki via SPARQL 1.1 DELETE / INSERT."""
        target_id = _sanitize_id(establishment_id)
        ind_uri = f"edu:{target_id}"

        # Build update clauses
        delete_patterns = []
        insert_patterns = []

        if data.label is not None:
            delete_patterns.extend([f"{ind_uri} rdfs:label ?oldLabel .", f"{ind_uri} edu:nom ?oldNom ."])
            insert_patterns.extend([f'{ind_uri} rdfs:label "{data.label}"@fr .', f'{ind_uri} edu:nom "{data.label}" .'])

        if data.class_name is not None:
            delete_patterns.append(f"{ind_uri} a ?oldType .")
            insert_patterns.append(f"{ind_uri} a owl:NamedIndividual , edu:{data.class_name} .")

        if data.ville is not None:
            delete_patterns.append(f"{ind_uri} edu:ville ?oldVille .")
            insert_patterns.append(f'{ind_uri} edu:ville "{data.ville}" .')

        if data.adresse is not None:
            delete_patterns.append(f"{ind_uri} edu:adresse ?oldAdresse .")
            insert_patterns.append(f'{ind_uri} edu:adresse "{data.adresse}" .')

        if data.site_web is not None:
            delete_patterns.append(f"{ind_uri} edu:siteWeb ?oldWeb .")
            insert_patterns.append(f'{ind_uri} edu:siteWeb "{data.site_web}" .')

        if data.telephone is not None:
            delete_patterns.append(f"{ind_uri} edu:telephone ?oldTel .")
            insert_patterns.append(f'{ind_uri} edu:telephone "{data.telephone}" .')

        if data.email is not None:
            delete_patterns.append(f"{ind_uri} edu:email ?oldEmail .")
            insert_patterns.append(f'{ind_uri} edu:email "{data.email}" .')

        if data.statut is not None:
            delete_patterns.append(f"{ind_uri} edu:statut ?oldStatut .")
            insert_patterns.append(f'{ind_uri} edu:statut "{data.statut}" .')

        if data.description is not None:
            delete_patterns.append(f"{ind_uri} edu:description ?oldDesc .")
            insert_patterns.append(f'{ind_uri} edu:description "{data.description}" .')

        if data.mode_enseignement is not None:
            delete_patterns.append(f"{ind_uri} edu:modeEnseignement ?oldMode .")
            insert_patterns.append(f'{ind_uri} edu:modeEnseignement "{data.mode_enseignement}" .')

        if data.domaine is not None:
            delete_patterns.append(f"{ind_uri} edu:domaine ?oldDom .")
            insert_patterns.append(f'{ind_uri} edu:domaine "{data.domaine}" .')

        if not insert_patterns:
            return {"success": True, "message": "Aucun champ modifié.", "sparql": None}

        # Build SPARQL 1.1 DELETE / INSERT block
        del_block = "\n  ".join(delete_patterns)
        ins_block = "\n  ".join(insert_patterns)

        update_sparql = f"""{PREFIXES}
DELETE {{
  {del_block}
}}
INSERT {{
  {ins_block}
}}
WHERE {{
  OPTIONAL {{ {ind_uri} rdfs:label ?oldLabel }}
  OPTIONAL {{ {ind_uri} edu:nom ?oldNom }}
  OPTIONAL {{ {ind_uri} a ?oldType . FILTER(?oldType != owl:NamedIndividual) }}
  OPTIONAL {{ {ind_uri} edu:ville ?oldVille }}
  OPTIONAL {{ {ind_uri} edu:adresse ?oldAdresse }}
  OPTIONAL {{ {ind_uri} edu:siteWeb ?oldWeb }}
  OPTIONAL {{ {ind_uri} edu:telephone ?oldTel }}
  OPTIONAL {{ {ind_uri} edu:email ?oldEmail }}
  OPTIONAL {{ {ind_uri} edu:statut ?oldStatut }}
  OPTIONAL {{ {ind_uri} edu:description ?oldDesc }}
  OPTIONAL {{ {ind_uri} edu:modeEnseignement ?oldMode }}
  OPTIONAL {{ {ind_uri} edu:domaine ?oldDom }}
}}
"""
        res = await sparql_service.execute_update(update_sparql)
        return {
            "success": res.get("success", False),
            "id": target_id,
            "sparql": update_sparql,
            "error": res.get("error"),
        }

    async def delete(self, establishment_id: str) -> Dict[str, Any]:
        """Delete an establishment and its connected links via SPARQL 1.1 DELETE WHERE."""
        target_id = _sanitize_id(establishment_id)
        ind_uri = f"edu:{target_id}"

        delete_sparql = f"""{PREFIXES}
DELETE WHERE {{
  {ind_uri} ?p ?o .
}} ;
DELETE WHERE {{
  ?s ?p {ind_uri} .
}}
"""
        res = await sparql_service.execute_update(delete_sparql)
        return {
            "success": res.get("success", False),
            "id": target_id,
            "sparql": delete_sparql,
            "error": res.get("error"),
        }

    async def export_turtle(self, establishment_id: str) -> str:
        """Export the RDF Turtle representation of an establishment."""
        target_id = _sanitize_id(establishment_id)
        items = await self.get_all(name=target_id)
        if not items:
            return f"# Établissement '{establishment_id}' introuvable."
        item = items[0]

        lines = [
            "@prefix edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#> .",
            "@prefix owl: <http://www.w3.org/2002/07/owl#> .",
            "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
            "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
            "",
            f"edu:{item.id} a owl:NamedIndividual , edu:{item.class_name} ;",
            f'    rdfs:label "{item.label}"@fr ;',
            f'    edu:nom "{item.label}" ;',
        ]
        if item.ville:
            lines.append(f'    edu:ville "{item.ville}" ;')
        if item.adresse:
            lines.append(f'    edu:adresse "{item.adresse}" ;')
        if item.site_web:
            lines.append(f'    edu:siteWeb "{item.site_web}"^^xsd:anyURI ;')
        if item.statut:
            lines.append(f'    edu:statut "{item.statut}" ;')
        if item.mode_enseignement:
            lines.append(f'    edu:modeEnseignement "{item.mode_enseignement}" ;')
        if item.domaine:
            lines.append(f'    edu:domaine "{item.domaine}" ;')

        for f in item.formations_organisees:
            lines.append(f'    edu:organise edu:{f.id} ;')
        for p in item.programmes_proposes:
            lines.append(f'    edu:propose edu:{p.id} ;')

        # Replace last semicolon with dot
        if lines[-1].endswith(";"):
            lines[-1] = lines[-1][:-1] + "."

        return "\n".join(lines)

    async def execute_chat_command(self, command: str) -> Dict[str, Any]:
        """Execute a natural language command (TALN) for Établissements (Create, Update, Delete, Query)."""
        cmd_clean = command.strip()
        cmd_lower = cmd_clean.lower()

        # 1. CREATE COMMAND: e.g. "créer une université privée nommée SESAME à Ariana"
        create_match = re.search(
            r"\b(cr[eé]er|ajouter|add|create|nouveau|nouvelle)\b\s+(un\s+|une\s+|an?\s+)?(?P<type>universit[eé]|facult[eé]|institut|ecole|école|centre|etablissement|établissement)?\s*(priv[eé]e?|publique?)?\s*(nomm[eé]e?\s+|named\s+|appel[eé]e?\s+|:)?\s*(?P<name>[a-z0-9_à-ÿ\s-]+?)(?:\s+(?:[aà]|in|vers)\s+(?P<city>[a-z_à-ÿ]+))?$",
            cmd_lower,
            re.IGNORECASE,
        )

        if create_match and ("nomm" in cmd_lower or "named" in cmd_lower or any(t in cmd_lower for t in ["universit", "ecole", "école", "institut", "centre", "etablissement"])):
            raw_type = create_match.group("type") or "universite"
            raw_name = create_match.group("name").strip()
            raw_city = create_match.group("city")

            name_clean = re.sub(r'["\']', '', raw_name).strip()
            name_clean = " ".join(w.capitalize() for w in name_clean.split())
            if not name_clean:
                name_clean = "Nouvel Etablissement"

            city_clean = (raw_city.capitalize() if raw_city else "Tunis").strip()

            c_name = "Universite_Privee"
            if "publique" in cmd_lower:
                c_name = "Universite_Publique"
            elif "ecole" in cmd_lower or "école" in cmd_lower:
                c_name = "Ecole"
            elif "institut" in cmd_lower or "iset" in cmd_lower:
                c_name = "Institut"
            elif "centre" in cmd_lower:
                c_name = "Centre_Formation"

            create_data = EtablissementCreate(
                label=name_clean,
                class_name=c_name,
                ville=city_clean,
                statut="Accrédité",
            )
            res = await self.create(create_data)
            all_items = await self.get_all()
            return {
                "success": res.get("success", False),
                "action": "create",
                "message": f"L'établissement '{name_clean}' ({c_name}) à {city_clean} a été inséré dans Fuseki via SPARQL INSERT DATA.",
                "sparql": res.get("sparql"),
                "affected_id": res.get("id"),
                "records": [x.model_dump() for x in all_items],
            }

        # 2. DELETE COMMAND: e.g. "supprimer l'établissement SESAME", "delete university ESPRIT"
        delete_match = re.search(
            r"\b(supprimer|effacer|delete|remove)\b\s+(l['\s]|la\s+|le\s+|the\s+)?(etablissement|établissement|universit[eé]|ecole|école|institut|centre)?\s*(?P<name>.+)",
            cmd_lower,
            re.IGNORECASE,
        )

        if delete_match:
            raw_name = delete_match.group("name").strip()
            name_clean = re.sub(r'["\']', '', raw_name).strip()
            name_clean = re.sub(r"^(l['\s]|la\s+|le\s+|the\s+)?(etablissement|établissement|universite|université|ecole|école|institut|centre)\s+", "", name_clean, flags=re.IGNORECASE).strip()
            target_id = _sanitize_id(name_clean)

            current = await self.get_all()
            found = next(
                (item for item in current if item.id.lower() == target_id.lower() or name_clean.lower() in item.label.lower() or name_clean.lower() in item.id.lower()),
                None,
            )
            actual_id = found.id if found else target_id

            del_res = await self.delete(actual_id)
            all_items = await self.get_all()
            return {
                "success": del_res.get("success", False),
                "action": "delete",
                "message": f"L'établissement '{actual_id}' a été supprimé de Fuseki via SPARQL DELETE.",
                "sparql": del_res.get("sparql"),
                "affected_id": actual_id,
                "records": [x.model_dump() for x in all_items],
            }

        # 3. UPDATE COMMAND: e.g. "modifier le site web de ESPRIT à https://esprit.tn", "changer la ville de ESPRIT en Ariana"
        update_match = re.search(
            r"\b(modifier|changer|mettre [aà] jour|update|change|set)\b\s+(le\s+|la\s+|l['\s])?(?P<prop>site\s*web|site|url|web|ville|adresse|t[ée]l[ée]phone|tel|statut|email|courriel|nom|label)\b\s+(de\s+|d['\s]|for\s+|of\s+)?(?P<etab>[a-z0-9_à-ÿ\s-]+?)\s+(à|[aà]|en|par|vers|to|=)\s+(?P<value>.+)",
            cmd_lower,
            re.IGNORECASE,
        )

        if update_match:
            raw_prop = update_match.group("prop").strip().lower()
            raw_etab = update_match.group("etab").strip()
            raw_value = update_match.group("value").strip()

            value_clean = re.sub(r'["\']', '', raw_value).strip()
            etab_clean = re.sub(r'["\']', '', raw_etab).strip()
            etab_clean = re.sub(r"^(l['\s]|la\s+|le\s+|the\s+)?(etablissement|établissement|universite|université|ecole|école|institut)\s+", "", etab_clean, flags=re.IGNORECASE).strip()
            target_id = _sanitize_id(etab_clean)

            current = await self.get_all()
            found = next(
                (item for item in current if item.id.lower() == target_id.lower() or etab_clean.lower() in item.label.lower() or etab_clean.lower() in item.id.lower()),
                None,
            )

            if not found:
                return {
                    "success": False,
                    "action": "update",
                    "message": f"Établissement '{etab_clean}' introuvable dans l'ontologie.",
                    "sparql": None,
                    "affected_id": None,
                    "records": [x.model_dump() for x in current],
                }

            update_data = EtablissementUpdate()
            if any(k in raw_prop for k in ["site", "url", "web"]):
                update_data.site_web = value_clean
            elif "ville" in raw_prop:
                update_data.ville = value_clean.capitalize()
            elif "adresse" in raw_prop:
                update_data.adresse = value_clean
            elif any(k in raw_prop for k in ["tel", "téléphone", "telephone"]):
                update_data.telephone = value_clean
            elif any(k in raw_prop for k in ["mail", "email"]):
                update_data.email = value_clean
            elif "statut" in raw_prop:
                update_data.statut = value_clean.capitalize()
            elif any(k in raw_prop for k in ["nom", "label"]):
                update_data.label = value_clean

            upd_res = await self.update(found.id, update_data)
            all_items = await self.get_all()
            return {
                "success": upd_res.get("success", False),
                "action": "update",
                "message": f"Propriété '{raw_prop}' mise à jour pour '{found.label}' via SPARQL DELETE / INSERT.",
                "sparql": upd_res.get("sparql"),
                "affected_id": found.id,
                "records": [x.model_dump() for x in all_items],
            }

        # 4. QUERY / FILTER COMMAND: e.g. "lister les établissements à Tunis", "quelles sont les universités privées ?"
        all_items = await self.get_all()
        filtered = all_items

        city_match = re.search(r"\b([aà]|in|vers)\s+(?P<city>tunis|ariana|sousse|sfax|monastir|bizerte|nabeul)\b", cmd_lower)
        if city_match:
            c = city_match.group("city").capitalize()
            filtered = [x for x in filtered if (x.ville or "").lower() == c.lower()]

        if "privé" in cmd_lower or "prive" in cmd_lower:
            filtered = [x for x in filtered if "prive" in x.class_name.lower() or "privé" in (x.statut or "").lower()]
        elif "publique" in cmd_lower or "public" in cmd_lower:
            filtered = [x for x in filtered if "publique" in x.class_name.lower() or "public" in (x.statut or "").lower()]
        elif "école" in cmd_lower or "ecole" in cmd_lower:
            filtered = [x for x in filtered if "ecole" in x.class_name.lower()]
        elif "institut" in cmd_lower:
            filtered = [x for x in filtered if "institut" in x.class_name.lower()]

        query_sparql = f"""{PREFIXES}
SELECT DISTINCT ?etablissement ?nom ?ville ?siteWeb ?statut WHERE {{
  ?etablissement a ?type .
  ?type rdfs:subClassOf* ?root .
  FILTER(CONTAINS(STR(?root), "tablissement"))
  OPTIONAL {{ ?etablissement edu:nom ?nom }}
  OPTIONAL {{ ?etablissement edu:ville ?ville }}
  OPTIONAL {{ ?etablissement edu:siteWeb ?siteWeb }}
  OPTIONAL {{ ?etablissement edu:statut ?statut }}
}} ORDER BY ?nom
"""
        return {
            "success": True,
            "action": "list",
            "message": f"{len(filtered)} établissement(s) trouvé(s) correspondant à votre requête.",
            "sparql": query_sparql,
            "affected_id": None,
            "records": [x.model_dump() for x in filtered],
        }


etablissement_service = EtablissementService()
