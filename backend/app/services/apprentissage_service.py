"""Service for managing the Apprentissage branch (CRUD & NLP commands).

Executes W3C SPARQL 1.1 queries and updates against Apache Jena Fuseki with local fallback.
"""

import logging
import re
import time
import unicodedata
from typing import Any, Dict, List, Optional, Set

from app.schemas.apprentissage import (
    ApprentissageClassItem,
    ApprentissageCreate,
    ApprentissageItem,
    ApprentissageUpdate,
)
from app.services.sparql_service import sparql_service

logger = logging.getLogger("edusmart.apprentissage")

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
    """Deduce high-level category (Évaluation, Activité, Parcours, Type) from class name and ancestry."""
    text = f"{class_name} {parent_name or ''}".lower()
    if any(k in text for k in ["evalu", "évalu", "examen", "quiz", "test", "exercice"]):
        return "Évaluation"
    if any(k in text for k in ["parcours", "licence", "master", "certification", "reconversion"]):
        return "Parcours"
    if any(k in text for k in ["collaboratif", "equipe", "équipe", "encadr", "individuel", "autoformation", "tutorat"]):
        return "Type_Apprentissage"
    return "Activité"


def _determine_modalite(class_name: str, text: Optional[str] = None) -> str:
    """Determine learning modality (Présentiel, En ligne, Hybride)."""
    full_text = f"{class_name} {text or ''}".lower()
    if any(k in full_text for k in ["ligne", "virtuel", "distance", "numerique", "numérique", "online"]):
        return "En ligne"
    if any(k in full_text for k in ["hybride", "mixte", "blended"]):
        return "Hybride"
    return "Présentiel"


# Initial seed individuals for rich demonstration out of the box
SEED_APPRENTISSAGES: List[Dict[str, Any]] = [
    {
        "id": "Examen_Final_Java",
        "label": "Examen Final Java & POO",
        "class_name": "Examen_Final",
        "category": "Évaluation",
        "modalite": "Présentiel",
        "description": "Épreuve sommative sur la programmation orientée objet, héritage, polymorphisme et exceptions.",
        "score": 16.5,
        "date_evaluation": "2026-06-15",
        "statut": "Terminé",
        "evalue_competence": "Programmation_Java",
        "competence_label": "Programmation Java",
    },
    {
        "id": "TP_Web_Semantique",
        "label": "TP Guidé Ontologies OWL 2 DL",
        "class_name": "TP_Guidé",
        "category": "Activité",
        "modalite": "Présentiel",
        "description": "Séance pratique de modélisation sous Protégé avec formalisation des axiomes et vérification HermiT.",
        "score": 18.0,
        "date_evaluation": "2026-10-25",
        "statut": "Validé",
        "evalue_competence": "Ontologies_OWL",
        "competence_label": "Ontologies OWL",
    },
    {
        "id": "Quiz_SPARQL_Intermediaire",
        "label": "Quiz Auto-corrigé SPARQL 1.1",
        "class_name": "Quiz_AutoCorrigé",
        "category": "Évaluation",
        "modalite": "En ligne",
        "description": "Évaluation formative en ligne mesurant la maîtrise des clauses SELECT, FILTER regex et OPTIONAL.",
        "score": 15.5,
        "date_evaluation": "2026-10-20",
        "statut": "Validé",
        "evalue_competence": "Requetes_SPARQL",
        "competence_label": "Requêtes SPARQL",
    },
    {
        "id": "Classe_Virtuelle_NLP",
        "label": "Classe Virtuelle TALN spaCy",
        "class_name": "Classe_Virtuelle_Interactive",
        "category": "Activité",
        "modalite": "En ligne",
        "description": "Session synchrone interactive sur le pipeline linguistique spaCy : tokenisation, lemmes et mapping SPARQL.",
        "score": None,
        "date_evaluation": "2026-11-05",
        "statut": "Planifié",
        "evalue_competence": "Traitement_Langage_Naturel",
        "competence_label": "Traitement du Langage Naturel",
    },
    {
        "id": "Parcours_Licence_Informatique",
        "label": "Parcours Licence Informatique (3 ans)",
        "class_name": "Parcours_Licence_Informatique",
        "category": "Parcours",
        "modalite": "Présentiel",
        "description": "Curriculum universitaire complet couvrant algorithmique, bases de données, réseaux et développement web.",
        "score": None,
        "date_evaluation": "2026-09-01",
        "statut": "En cours",
        "evalue_competence": None,
        "competence_label": None,
    },
    {
        "id": "Projet_Hybride_EduSmart",
        "label": "Projet Hybride Collaboratif EduSmart",
        "class_name": "Projet_Hybride_Collaboratif",
        "category": "Activité",
        "modalite": "Hybride",
        "description": "Projet d'ingénierie sémantique en équipe avec triplestore Jena Fuseki, FastAPI et interface React.",
        "score": 19.0,
        "date_evaluation": "2026-10-28",
        "statut": "En cours",
        "evalue_competence": "Web_Semantique",
        "competence_label": "Web Sémantique",
    },
]


class ApprentissageService:
    """Service to handle CRUD and natural language interactions for the Apprentissage branch."""

    def __init__(self) -> None:
        self._local_cache: Dict[str, ApprentissageItem] = {}
        for s in SEED_APPRENTISSAGES:
            s_id = str(s["id"])
            uri = f"http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#{s_id}"
            score_val: Optional[float] = None
            if s.get("score") is not None:
                try:
                    score_val = float(str(s["score"]))
                except (ValueError, TypeError):
                    score_val = None

            self._local_cache[s_id] = ApprentissageItem(
                id=s_id,
                uri=uri,
                label=str(s["label"]),
                class_name=str(s["class_name"]),
                category=str(s["category"]) if s.get("category") else None,
                modalite=str(s["modalite"]) if s.get("modalite") else None,
                description=str(s["description"]) if s.get("description") else None,
                score=score_val,
                date_evaluation=str(s["date_evaluation"]) if s.get("date_evaluation") else None,
                statut=str(s["statut"]) if s.get("statut") else "Planifié",
                evalue_competence=str(s["evalue_competence"]) if s.get("evalue_competence") else None,
                competence_label=str(s["competence_label"]) if s.get("competence_label") else None,
            )

    async def get_classes(self) -> List[ApprentissageClassItem]:
        """Return all subclasses under edu:Apprentissage with category & parent."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?class_name ?label ?parent_name WHERE {{
          ?sub rdfs:subClassOf* edu:Apprentissage .
          BIND(STRAFTER(STR(?sub), "#") AS ?class_name)
          OPTIONAL {{ ?sub rdfs:label ?label }}
          OPTIONAL {{
            ?sub rdfs:subClassOf ?parent .
            FILTER(?parent != owl:Thing)
            BIND(STRAFTER(STR(?parent), "#") AS ?parent_name)
          }}
          FILTER(?class_name != "" && ?class_name != "Thing" && ?class_name != "Apprentissage")
        }}
        ORDER BY ?class_name
        """
        res = await sparql_service.execute_query(query)
        classes_map: Dict[str, ApprentissageClassItem] = {}

        # Default fallback standard classes
        standard_classes = [
            ("Examen", "Examen", "Évaluation", "Évaluation"),
            ("Examen_Final", "Examen Final", "Évaluation", "Examen"),
            ("Quiz", "Quiz", "Évaluation", "Évaluation_Formative"),
            ("Quiz_AutoCorrigé", "Quiz Auto-corrigé", "Évaluation", "Quiz"),
            ("Exercice_Pratique", "Exercice Pratique", "Évaluation", "Évaluation_Formative"),
            ("TP_Guidé", "Travaux Pratiques Guidés", "Activité", "Activité_Apprentissage"),
            ("Cours_Magistral", "Cours Magistral", "Activité", "Activité_Apprentissage"),
            ("Classe_Virtuelle_Interactive", "Classe Virtuelle Interactive", "Activité", "Activité_Hybride"),
            ("Projet_Hybride_Collaboratif", "Projet Hybride Collaboratif", "Activité", "Activité_Hybride"),
            ("Parcours_Licence_Informatique", "Parcours Licence Informatique", "Parcours", "Parcours_Académique"),
            ("Parcours_Master_Spécialisé", "Parcours Master Spécialisé", "Parcours", "Parcours_Académique"),
            ("Tutorat_Individuel", "Tutorat Individuel", "Type_Apprentissage", "Type_Apprentissage"),
            ("Autoformation_Numérique", "Autoformation Numérique", "Type_Apprentissage", "Type_Apprentissage"),
        ]

        for c_name, lbl, cat, prt in standard_classes:
            classes_map[c_name] = ApprentissageClassItem(
                class_name=c_name,
                label=lbl,
                category=cat,
                parent=prt,
            )

        for rec in res.get("records", []):
            c_name = rec.get("class_name", "").strip()
            if not c_name or c_name == "Apprentissage":
                continue
            parent = rec.get("parent_name") or "Apprentissage"
            label = rec.get("label") or c_name.replace("_", " ")
            category = _determine_category(c_name, parent)

            classes_map[c_name] = ApprentissageClassItem(
                class_name=c_name,
                label=label,
                category=category,
                parent=parent,
            )

        result = list(classes_map.values())
        result.sort(key=lambda x: (x.category or "", x.label or x.class_name))
        return result

    async def get_all(
        self,
        name: Optional[str] = None,
        class_name: Optional[str] = None,
        category: Optional[str] = None,
        modalite: Optional[str] = None,
    ) -> List[ApprentissageItem]:
        """Fetch all individuals belonging to Apprentissage or its subclasses."""
        query = f"""{PREFIXES}
        SELECT DISTINCT ?uri ?label ?class_name ?parent_name ?description ?dateEvaluation ?score ?statut ?modalite ?comp ?compLabel WHERE {{
          ?uri a ?type .
          ?type rdfs:subClassOf* edu:Apprentissage .
          BIND(STRAFTER(STR(?type), "#") AS ?class_name)
          FILTER(?class_name != "Thing" && ?class_name != "Apprentissage")
          OPTIONAL {{ ?type rdfs:subClassOf ?parent . FILTER(?parent != owl:Thing) BIND(STRAFTER(STR(?parent), "#") AS ?parent_name) }}
          OPTIONAL {{ ?uri rdfs:label ?label }}
          OPTIONAL {{ ?uri edu:nom ?nomProp }}
          OPTIONAL {{ ?uri edu:description ?description }}
          OPTIONAL {{ ?uri edu:dateEvaluation ?dateEvaluation }}
          OPTIONAL {{ ?uri edu:score ?score }}
          OPTIONAL {{ ?uri edu:statut ?statut }}
          OPTIONAL {{ ?uri edu:modalite ?modalite }}
          OPTIONAL {{
            ?uri edu:évalue ?comp .
            OPTIONAL {{ ?comp rdfs:label|edu:nom ?compLabel }}
          }}
        }}
        ORDER BY ?class_name ?uri
        """
        items_map: Dict[str, ApprentissageItem] = {}

        # First add local seed items
        for k, v in self._local_cache.items():
            items_map[k] = v

        try:
            res = await sparql_service.execute_query(query)
            for rec in res.get("records", []):
                uri = rec.get("uri", "")
                if not uri or "#" not in uri:
                    continue
                ind_id = uri.split("#")[-1]

                label = rec.get("label") or rec.get("nomProp") or ind_id.replace("_", " ")
                c_name = rec.get("class_name") or "Activité_Apprentissage"
                parent_name = rec.get("parent_name")
                cat = _determine_category(c_name, parent_name)

                score_val = None
                if rec.get("score"):
                    try:
                        score_val = float(rec["score"])
                    except (ValueError, TypeError):
                        pass

                mod = rec.get("modalite") or _determine_modalite(c_name, rec.get("description"))

                comp_id = None
                comp_lbl = None
                if rec.get("comp"):
                    comp_uri = rec["comp"]
                    comp_id = comp_uri.split("#")[-1] if "#" in comp_uri else comp_uri
                    comp_lbl = rec.get("compLabel") or comp_id.replace("_", " ")

                items_map[ind_id] = ApprentissageItem(
                    id=ind_id,
                    uri=uri,
                    label=label,
                    class_name=c_name,
                    category=cat,
                    modalite=mod,
                    description=rec.get("description"),
                    score=score_val,
                    date_evaluation=rec.get("dateEvaluation"),
                    statut=rec.get("statut") or "Planifié",
                    evalue_competence=comp_id,
                    competence_label=comp_lbl,
                )
        except Exception as e:
            logger.warning("SPARQL query failed, using in-memory cache: %s", e)

        items = list(items_map.values())

        # In-memory filtering
        if name:
            q = name.lower()
            items = [i for i in items if q in i.label.lower() or (i.description and q in i.description.lower())]

        if class_name and class_name != "Tous":
            items = [i for i in items if i.class_name.lower() == class_name.lower()]

        if category and category != "Tous":
            items = [i for i in items if (i.category or "").lower() == category.lower()]

        if modalite and modalite != "Tous":
            items = [i for i in items if (i.modalite or "").lower() == modalite.lower()]

        items.sort(key=lambda x: x.label.lower())
        return items

    async def get_by_id(self, item_id: str) -> Optional[ApprentissageItem]:
        """Fetch a single Apprentissage individual by identifier."""
        all_items = await self.get_all()
        for i in all_items:
            if i.id == item_id or i.id.lower() == item_id.lower():
                return i
        return None

    async def create(self, data: ApprentissageCreate) -> Dict[str, Any]:
        """Create a new individual in the Apprentissage branch via SPARQL 1.1 INSERT DATA."""
        item_id = data.id or _sanitize_id(data.label)
        if not item_id:
            item_id = f"Apprentissage_{int(time.time())}"

        uri = f"http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#{item_id}"
        class_name = data.class_name or "Examen"
        category = data.category or _determine_category(class_name)
        modalite = data.modalite or _determine_modalite(class_name, data.description)

        # Build SPARQL INSERT DATA triples
        triples = [
            f"edu:{item_id} a edu:{class_name} .",
            f"edu:{item_id} edu:nom \"{data.label}\" .",
            f"edu:{item_id} rdfs:label \"{data.label}\" .",
            f"edu:{item_id} edu:statut \"{data.statut or 'Planifié'}\" .",
            f"edu:{item_id} edu:modalite \"{modalite}\" .",
        ]

        if data.description:
            clean_desc = data.description.replace('"', '\\"')
            triples.append(f"edu:{item_id} edu:description \"{clean_desc}\" .")

        if data.score is not None:
            triples.append(f"edu:{item_id} edu:score {data.score} .")

        if data.date_evaluation:
            triples.append(f"edu:{item_id} edu:dateEvaluation \"{data.date_evaluation}\"^^xsd:date .")

        if data.evalue_competence:
            comp_id = _sanitize_id(data.evalue_competence)
            triples.append(f"edu:{item_id} edu:évalue edu:{comp_id} .")

        sparql_update = f"""{PREFIXES}
        INSERT DATA {{
          {chr(10).join(triples)}
        }}
        """

        success = True
        try:
            res = await sparql_service.execute_update(sparql_update)
            success = res.get("success", False)
        except Exception as e:
            logger.error("Fuseki SPARQL update failed: %s", e)
            success = False

        # Always update local cache
        item = ApprentissageItem(
            id=item_id,
            uri=uri,
            label=data.label,
            class_name=class_name,
            category=category,
            modalite=modalite,
            description=data.description,
            score=data.score,
            date_evaluation=data.date_evaluation,
            statut=data.statut or "Planifié",
            evalue_competence=data.evalue_competence,
            competence_label=data.evalue_competence.replace("_", " ") if data.evalue_competence else None,
        )
        self._local_cache[item_id] = item

        return {
            "success": True,
            "id": item_id,
            "sparql": sparql_update,
            "message": f"Activité/Évaluation '{data.label}' créée avec succès dans la classe {class_name}.",
        }

    async def update(self, item_id: str, data: ApprentissageUpdate) -> Dict[str, Any]:
        """Update an existing Apprentissage individual via SPARQL 1.1 DELETE/INSERT."""
        existing = await self.get_by_id(item_id)
        if not existing:
            return {"success": False, "error": f"Apprentissage '{item_id}' introuvable."}

        new_label = data.label if data.label is not None else existing.label
        new_class = data.class_name if data.class_name is not None else existing.class_name
        new_category = data.category if data.category is not None else existing.category
        new_modalite = data.modalite if data.modalite is not None else existing.modalite
        new_desc = data.description if data.description is not None else existing.description
        new_score = data.score if data.score is not None else existing.score
        new_date = data.date_evaluation if data.date_evaluation is not None else existing.date_evaluation
        new_statut = data.statut if data.statut is not None else existing.statut
        new_comp = data.evalue_competence if data.evalue_competence is not None else existing.evalue_competence

        sparql_update = f"""{PREFIXES}
        DELETE {{
          edu:{item_id} edu:nom ?oldNom .
          edu:{item_id} rdfs:label ?oldLabel .
          edu:{item_id} a ?oldType .
          edu:{item_id} edu:description ?oldDesc .
          edu:{item_id} edu:score ?oldScore .
          edu:{item_id} edu:dateEvaluation ?oldDate .
          edu:{item_id} edu:statut ?oldStatut .
          edu:{item_id} edu:modalite ?oldModalite .
          edu:{item_id} edu:évalue ?oldComp .
        }}
        INSERT {{
          edu:{item_id} a edu:{new_class} .
          edu:{item_id} edu:nom "{new_label}" .
          edu:{item_id} rdfs:label "{new_label}" .
          edu:{item_id} edu:statut "{new_statut or 'Planifié'}" .
          edu:{item_id} edu:modalite "{new_modalite or 'Présentiel'}" .
          {f'edu:{item_id} edu:description "{new_desc}" .' if new_desc else ''}
          {f'edu:{item_id} edu:score {new_score} .' if new_score is not None else ''}
          {f'edu:{item_id} edu:dateEvaluation "{new_date}"^^xsd:date .' if new_date else ''}
          {f'edu:{item_id} edu:évalue edu:{_sanitize_id(new_comp)} .' if new_comp else ''}
        }}
        WHERE {{
          OPTIONAL {{ edu:{item_id} edu:nom ?oldNom }}
          OPTIONAL {{ edu:{item_id} rdfs:label ?oldLabel }}
          OPTIONAL {{ edu:{item_id} a ?oldType }}
          OPTIONAL {{ edu:{item_id} edu:description ?oldDesc }}
          OPTIONAL {{ edu:{item_id} edu:score ?oldScore }}
          OPTIONAL {{ edu:{item_id} edu:dateEvaluation ?oldDate }}
          OPTIONAL {{ edu:{item_id} edu:statut ?oldStatut }}
          OPTIONAL {{ edu:{item_id} edu:modalite ?oldModalite }}
          OPTIONAL {{ edu:{item_id} edu:évalue ?oldComp }}
        }}
        """

        try:
            await sparql_service.execute_update(sparql_update)
        except Exception as e:
            logger.warning("SPARQL update to Fuseki failed, continuing local update: %s", e)

        # Update cache
        self._local_cache[item_id] = ApprentissageItem(
            id=item_id,
            uri=f"http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#{item_id}",
            label=new_label,
            class_name=new_class,
            category=new_category or _determine_category(new_class),
            modalite=new_modalite or "Présentiel",
            description=new_desc,
            score=new_score,
            date_evaluation=new_date,
            statut=new_statut,
            evalue_competence=new_comp,
            competence_label=new_comp.replace("_", " ") if new_comp else None,
        )

        return {
            "success": True,
            "id": item_id,
            "sparql": sparql_update,
            "message": f"Activité/Évaluation '{new_label}' mise à jour avec succès.",
        }

    async def delete(self, item_id: str) -> Dict[str, Any]:
        """Delete an Apprentissage individual via SPARQL 1.1 DELETE WHERE."""
        sparql_delete = f"""{PREFIXES}
        DELETE WHERE {{
          edu:{item_id} ?p ?o .
        }} ;
        DELETE WHERE {{
          ?s ?p edu:{item_id} .
        }}
        """

        try:
            await sparql_service.execute_update(sparql_delete)
        except Exception as e:
            logger.warning("SPARQL delete on Fuseki failed: %s", e)

        self._local_cache.pop(item_id, None)

        return {
            "success": True,
            "id": item_id,
            "sparql": sparql_delete,
            "message": f"Individu Apprentissage '{item_id}' supprimé avec succès.",
        }

    async def execute_command(self, command: str) -> Dict[str, Any]:
        """Natural Language Processing (NLP/TALN) for Apprentissage commands.

        Interprets natural commands in French or English:
        - "créer un examen nommé Examen Final Web Sémantique avec score 17"
        - "créer un quiz nommé Quiz Ontologie OWL"
        - "créer un tp nommé TP Protégé"
        - "supprimer l'examen X"
        - "lister les évaluations" / "lister les activités"
        """
        cmd_clean = command.strip()
        cmd_lower = cmd_clean.lower()

        # 1. UPDATE / MODIFIER COMMAND
        # e.g.: "modifier le score de Examen Final Web Sémantique a 10"
        #       "changer la note de TP Guidé à 19"
        #       "mettre à jour le statut de Examen Final Java à Terminé"
        #       "renommer Examen Final Java en Examen Java 2026"
        #       "valider l'examen Examen Final Web Sémantique"
        update_match = re.search(
            r"\b(modifier|changer|mettre\s+[aà]\s+jour|update|change|set|passer)\b\s+(?:le\s+|la\s+|l['\s])?(?P<prop>score|note|bar[eè]me|points?|statut|statuts|status|[eé]tat|modalit[eé]|mode|date(?:_evaluation|\s+d['\s]?[eé]valuation)?|nom|titre|intitul[eé]|label|name|description|desc|d[eé]tail|classe|class|type|comp[eé]tence)\b\s+(?:de\s+|d['\s]|du\s+|pour\s+|for\s+|of\s+)?(?:l['\s]|l'examen\s+|le\s+tp\s+|le\s+quiz\s+|l'activit[eé]\s+|l'[eé]valuation\s+|le\s+|la\s+)?(?P<item>.+?)\s+(?:[aà]|en|vers|to|=|sur)\s+(?P<value>.+)",
            cmd_lower,
            re.IGNORECASE,
        )

        rename_match = None
        if not update_match:
            rename_match = re.search(
                r"\b(renommer|rename)\b\s+(?:l['\s]|l'examen\s+|le\s+tp\s+|le\s+quiz\s+|l'activit[eé]\s+|l'[eé]valuation\s+|le\s+|la\s+)?(?P<item>.+?)\s+(?:en|vers|to|as)\s+(?P<value>.+)",
                cmd_lower,
                re.IGNORECASE,
            )

        quick_status_match = None
        if not update_match and not rename_match:
            quick_status_match = re.search(
                r"\b(valider|terminer)\b\s+(?:l['\s]|l'examen\s+|le\s+tp\s+|le\s+quiz\s+|l'activit[eé]\s+|l'[eé]valuation\s+|le\s+|la\s+)?(?P<item>.+)",
                cmd_lower,
                re.IGNORECASE,
            )

        if update_match or rename_match or quick_status_match:
            if update_match:
                raw_prop = update_match.group("prop").strip().lower()
                raw_item = update_match.group("item").strip()
                raw_value = update_match.group("value").strip()
            elif rename_match:
                raw_prop = "nom"
                raw_item = rename_match.group("item").strip()
                raw_value = rename_match.group("value").strip()
            elif quick_status_match:
                action_verb = quick_status_match.group(1).lower()
                raw_prop = "statut"
                raw_item = quick_status_match.group("item").strip()
                score_match = re.search(r"\bavec\s+(?:score\s+|note\s+)?(\d+(?:[\.,]\d+)?)", raw_item, re.IGNORECASE)
                if score_match:
                    raw_prop = "score"
                    raw_value = score_match.group(1)
                    raw_item = re.sub(r"\bavec\s+.*", "", raw_item, flags=re.IGNORECASE).strip()
                else:
                    raw_value = "Validé" if "valid" in action_verb else "Terminé"
            else:
                raw_prop, raw_item, raw_value = "", "", ""

            clean_item = re.sub(r'["\']', '', raw_item).strip()
            clean_item = re.sub(
                r"^(?:l['\s]|le\s+|la\s+|un\s+|une\s+|the\s+)?(?:examen|tp|quiz|activite|activité|apprentissage|parcours|item|évaluation|evaluation)?\s*(?:nommé|nommée|nommee|called|named)?\s*",
                "",
                clean_item,
                flags=re.IGNORECASE,
            ).strip()
            target_id = _sanitize_id(clean_item)

            current_items = await self.get_all()

            found: Optional[ApprentissageItem] = None
            for itm in current_items:
                if itm.id.lower() == target_id.lower():
                    found = itm
                    break

            if not found:
                for itm in current_items:
                    if itm.label.lower() == clean_item.lower():
                        found = itm
                        break

            if not found:
                norm_target = _sanitize_id(clean_item).lower()
                for itm in current_items:
                    if _sanitize_id(itm.label).lower() == norm_target or _sanitize_id(itm.id).lower() == norm_target:
                        found = itm
                        break

            if not found and len(clean_item) >= 3:
                cl_low = clean_item.lower()
                for itm in current_items:
                    if cl_low in itm.label.lower() or cl_low in itm.id.lower():
                        found = itm
                        break

            if not found and len(clean_item) >= 3:
                cl_low = clean_item.lower()
                for itm in current_items:
                    if itm.label.lower() in cl_low or itm.id.lower().replace("_", " ") in cl_low:
                        found = itm
                        break

            if not found:
                return {
                    "success": False,
                    "action": "update",
                    "message": f"Élément d'apprentissage '{clean_item}' introuvable dans le triplestore. Vérifiez le nom ou l'identifiant.",
                    "sparql": None,
                    "affected_id": None,
                    "records": [i.model_dump() for i in current_items],
                }

            value_clean = re.sub(r'["\']', '', raw_value).strip()
            update_data = ApprentissageUpdate()
            prop_normalized = "propriété"
            display_val = value_clean

            if any(k in raw_prop for k in ["score", "note", "bar", "point"]):
                num_match = re.search(r"(\d+(?:[\.,]\d+)?)", value_clean)
                if num_match:
                    val_score = float(num_match.group(1).replace(",", "."))
                    update_data.score = val_score
                    prop_normalized = "score"
                    display_val = f"{val_score}/20" if val_score <= 20 else str(val_score)
                    if found.statut in ["Planifié", "En cours", None]:
                        update_data.statut = "Validé" if val_score >= 10 else "Terminé"
                else:
                    return {
                        "success": False,
                        "action": "update",
                        "message": f"Valeur de score invalide : '{value_clean}'. Précisez une valeur numérique (ex: 10 ou 16.5).",
                    }

            elif any(k in raw_prop for k in ["statut", "status", "état", "etat"]):
                v_lower = value_clean.lower()
                if any(k in v_lower for k in ["valide", "validé", "reussi", "réussi"]):
                    val_statut = "Validé"
                elif any(k in v_lower for k in ["termine", "terminé", "fini", "clos", "passé"]):
                    val_statut = "Terminé"
                elif any(k in v_lower for k in ["cours", "en cours", "progress"]):
                    val_statut = "En cours"
                elif any(k in v_lower for k in ["planifie", "planifié", "prévu", "prevu"]):
                    val_statut = "Planifié"
                else:
                    val_statut = value_clean.capitalize()
                update_data.statut = val_statut
                prop_normalized = "statut"
                display_val = val_statut

            elif any(k in raw_prop for k in ["modalite", "modalité", "mode"]):
                v_lower = value_clean.lower()
                if any(k in v_lower for k in ["ligne", "distance", "virtuel", "online"]):
                    val_mod = "En ligne"
                elif any(k in v_lower for k in ["hybride", "mixte", "blended"]):
                    val_mod = "Hybride"
                else:
                    val_mod = "Présentiel"
                update_data.modalite = val_mod
                prop_normalized = "modalité"
                display_val = val_mod

            elif any(k in raw_prop for k in ["date", "évaluation", "evaluation"]):
                update_data.date_evaluation = value_clean
                prop_normalized = "date d'évaluation"

            elif any(k in raw_prop for k in ["nom", "titre", "label", "name", "intitul"]):
                update_data.label = value_clean
                prop_normalized = "titre"

            elif any(k in raw_prop for k in ["desc", "detail", "détail"]):
                update_data.description = value_clean
                prop_normalized = "description"

            elif any(k in raw_prop for k in ["classe", "class", "type"]):
                update_data.class_name = value_clean.replace(" ", "_")
                prop_normalized = "classe ontologique"

            elif any(k in raw_prop for k in ["comp", "évalue", "evalue"]):
                update_data.evalue_competence = _sanitize_id(value_clean)
                prop_normalized = "compétence évaluée"

            res = await self.update(found.id, update_data)
            all_items = await self.get_all()
            return {
                "success": res.get("success", False),
                "action": "update",
                "message": f"Le {prop_normalized} de '{found.label}' a été mis à jour à {display_val} via SPARQL 1.1 UPDATE.",
                "sparql": res.get("sparql"),
                "affected_id": found.id,
                "records": [i.model_dump() for i in all_items],
            }

        # 2. CREATE COMMAND
        if any(cmd_lower.startswith(w) for w in ["créer", "creer", "ajouter", "nouvel", "nouvelle", "create", "add"]):
            # Extract score if specified: "avec score 17.5", "note 16"
            score = None
            score_match = re.search(r"(?:score|note|barème|bareme)\s+(?:de\s+)?(\d+(?:[\.,]\d+)?)", cmd_lower)
            if score_match:
                try:
                    score = float(score_match.group(1).replace(",", "."))
                except ValueError:
                    pass

            # Extract label
            name_match = re.search(r"(?:nommé|nommee|nommée|nom|titre|called|named)\s+[\"']?([^\"'.,;]+)[\"']?", cmd_clean, re.IGNORECASE)
            if name_match:
                label = name_match.group(1).strip()
                label = re.sub(r"\s+(?:avec|de\s+score|score|note|pour).*", "", label, flags=re.IGNORECASE).strip()
            else:
                # Remove action words
                cleaned = re.sub(r"^(?:créer|creer|ajouter|create|add)\s+(?:un|une|le|la|a|an)?\s*", "", cmd_clean, flags=re.IGNORECASE)
                cleaned = re.sub(r"\s+(?:avec|de\s+score|score|note|pour).*", "", cleaned, flags=re.IGNORECASE)
                label = cleaned.strip() or f"Activité_{int(time.time())}"

            # Determine class
            target_class = "Activité_Apprentissage"
            if "examen" in cmd_lower:
                target_class = "Examen_Final" if "final" in cmd_lower else "Examen"
            elif "quiz" in cmd_lower:
                target_class = "Quiz_AutoCorrigé" if "auto" in cmd_lower else "Quiz"
            elif "tp" in cmd_lower or "travaux pratiques" in cmd_lower:
                target_class = "TP_Guidé"
            elif "classe virtuelle" in cmd_lower:
                target_class = "Classe_Virtuelle_Interactive"
            elif "parcours" in cmd_lower:
                target_class = "Parcours_Licence_Informatique" if "licence" in cmd_lower else "Parcours_Apprentissage"
            elif "projet" in cmd_lower:
                target_class = "Projet_Hybride_Collaboratif"

            res = await self.create(
                ApprentissageCreate(
                    label=label,
                    class_name=target_class,
                    score=score,
                    date_evaluation="2026-11-15" if "examen" in cmd_lower or "quiz" in cmd_lower else None,
                    statut="Validé" if score else "Planifié",
                )
            )

            return {
                "success": True,
                "action": "create",
                "message": f"Activité/Évaluation '{label}' créée avec succès dans la classe {target_class}.",
                "sparql": res.get("sparql"),
                "affected_id": res.get("id"),
            }

        # 2. DELETE COMMAND
        if any(cmd_lower.startswith(w) for w in ["supprimer", "effacer", "retirer", "delete", "remove"]):
            cleaned = re.sub(r"^(?:supprimer|effacer|retirer|delete|remove)\s+(?:l'|le\s+|la\s+|un\s+|une\s+)?(?:examen|tp|quiz|activite|activité|apprentissage|parcours|item|évaluation|evaluation)?\s*(?:nommé|nommée|nommee|called|named)?\s*", "", cmd_clean, flags=re.IGNORECASE).strip()
            target = cleaned.strip("\"' ")
            target_id = _sanitize_id(target)

            # Find matching item
            items = await self.get_all()
            matched = [i for i in items if i.id.lower() == target_id.lower()]
            if not matched:
                matched = [i for i in items if target.lower() in i.label.lower() and len(target) > 2]

            if matched:
                item_to_del = matched[0]
                res = await self.delete(item_to_del.id)
                return {
                    "success": True,
                    "action": "delete",
                    "message": f"Activité/Évaluation '{item_to_del.label}' supprimée du triplestore.",
                    "sparql": res.get("sparql"),
                    "affected_id": item_to_del.id,
                }
            else:
                return {
                    "success": False,
                    "action": "delete",
                    "message": f"Aucun élément correspondant à '{target}' n'a été trouvé.",
                }

        # 3. LIST / SEARCH COMMAND
        if any(w in cmd_lower for w in ["lister", "afficher", "trouver", "donne", "montre", "list", "show", "get"]):
            cat = None
            if "évaluation" in cmd_lower or "examen" in cmd_lower or "quiz" in cmd_lower:
                cat = "Évaluation"
            elif "parcours" in cmd_lower:
                cat = "Parcours"
            elif "activité" in cmd_lower or "tp" in cmd_lower:
                cat = "Activité"

            mod = None
            if "ligne" in cmd_lower or "virtuel" in cmd_lower:
                mod = "En ligne"
            elif "hybride" in cmd_lower:
                mod = "Hybride"
            elif "présentiel" in cmd_lower:
                mod = "Présentiel"

            items = await self.get_all(category=cat, modalite=mod)
            sparql_sample = f"""{PREFIXES}
            SELECT ?uri ?label ?class ?score ?modalite WHERE {{
              ?uri a ?class .
              ?class rdfs:subClassOf* edu:Apprentissage .
              OPTIONAL {{ ?uri rdfs:label ?label }}
              OPTIONAL {{ ?uri edu:score ?score }}
              OPTIONAL {{ ?uri edu:modalite ?modalite }}
            }} LIMIT 25
            """

            return {
                "success": True,
                "action": "list",
                "message": f"{len(items)} éléments d'apprentissage trouvés.",
                "sparql": sparql_sample,
                "records": [i.model_dump() for i in items[:15]],
            }

        # Unknown command fallback
        return {
            "success": False,
            "action": "unknown",
            "message": "Commande non reconnue. Exemples : 'créer un examen nommé Examen Java avec score 18', 'modifier le score de Examen Final Web Sémantique à 10', 'changer le statut de TP Guidé à Terminé', 'lister les évaluations', 'supprimer l'examen X'.",
        }


apprentissage_service = ApprentissageService()
