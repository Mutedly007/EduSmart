"""Domain entity extractor for the EduSmart ontology.

Identifies named individuals, core classes, modalities, and properties
present in natural language user questions.
"""

import re
from typing import Any, Dict, List, Optional
from app.schemas.nlp import ExtractedEntity

BASE_URI = "http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#"

# Known named individuals in EduSmart ontology
KNOWN_INDIVIDUALS = {
    "ali": {"uri": f"{BASE_URI}Ali", "name": "Ali", "type": "Enseignant"},
    "ahmed": {"uri": f"{BASE_URI}ahmed", "name": "ahmed", "type": "Etudiant"},
    "wassim frigui": {"uri": f"{BASE_URI}Wassim_Frigui", "name": "Wassim_Frigui", "type": "Etudiant"},
    "wassim": {"uri": f"{BASE_URI}Wassim_Frigui", "name": "Wassim_Frigui", "type": "Etudiant"},
    "yassine ben ali": {"uri": f"{BASE_URI}Yassine_Ben_Ali", "name": "Yassine_Ben_Ali", "type": "Etudiant"},
    "yassine": {"uri": f"{BASE_URI}Yassine_Ben_Ali", "name": "Yassine_Ben_Ali", "type": "Etudiant"},
    "mohamed ben salah": {"uri": f"{BASE_URI}Mohamed_Ben_Salah", "name": "Mohamed_Ben_Salah", "type": "Enseignant"},
    "mohamed": {"uri": f"{BASE_URI}Mohamed_Ben_Salah", "name": "Mohamed_Ben_Salah", "type": "Enseignant"},
    "mariem trabelsi": {"uri": f"{BASE_URI}Mariem_Trabelsi", "name": "Mariem_Trabelsi", "type": "Enseignant"},
    "mariem": {"uri": f"{BASE_URI}Mariem_Trabelsi", "name": "Mariem_Trabelsi", "type": "Enseignant"},
    "esprit": {"uri": f"{BASE_URI}ESPRIT", "name": "ESPRIT", "type": "Université_Privée"},
    "java": {"uri": f"{BASE_URI}java", "name": "java", "type": "Cours_Pratique"},
    "formation java": {"uri": f"{BASE_URI}Formation_Java", "name": "Formation_Java", "type": "Formation"},
    "intelligence artificielle": {"uri": f"{BASE_URI}Intelligence_Artificielle", "name": "Intelligence_Artificielle", "type": "Cours"},
    "ia": {"uri": f"{BASE_URI}Intelligence_Artificielle", "name": "Intelligence_Artificielle", "type": "Cours"},
    "artificial intelligence": {"uri": f"{BASE_URI}Intelligence_Artificielle", "name": "Intelligence_Artificielle", "type": "Cours"},
    "machine learning": {"uri": f"{BASE_URI}Machine_Learning", "name": "Machine_Learning", "type": "Cours"},
    "ml": {"uri": f"{BASE_URI}Machine_Learning", "name": "Machine_Learning", "type": "Cours"},
    "algorithmique avancee": {"uri": f"{BASE_URI}Algorithmique_Avancee", "name": "Algorithmique_Avancee", "type": "Cours"},
    "algorithmique avancée": {"uri": f"{BASE_URI}Algorithmique_Avancee", "name": "Algorithmique_Avancee", "type": "Cours"},
    "licence informatique": {"uri": f"{BASE_URI}Licence_Informatique", "name": "Licence_Informatique", "type": "Programme_Licence"},
    "licence": {"uri": f"{BASE_URI}Licence_Informatique", "name": "Licence_Informatique", "type": "Programme_Licence"},
    "competence python": {"uri": f"{BASE_URI}Competence_Python", "name": "Competence_Python", "type": "Compétence"},
    "competence ia": {"uri": f"{BASE_URI}Competence_IA", "name": "Competence_IA", "type": "Compétence"},
    "algorithmique": {"uri": f"{BASE_URI}Algorithmique_Individu", "name": "Algorithmique_Individu", "type": "Programmation"},
    "programmation": {"uri": f"{BASE_URI}Programmation_Individu", "name": "Programmation_Individu", "type": "Programmation"},
    "examen final": {"uri": f"{BASE_URI}Examen_Final", "name": "Examen_Final", "type": "Examen"},
}

# Modality keywords
MODALITIES = {
    "hybride": {"uri": f"{BASE_URI}Hybride", "name": "Hybride"},
    "hybrid": {"uri": f"{BASE_URI}Hybride", "name": "Hybride"},
    "en ligne": {"uri": f"{BASE_URI}En_Ligne", "name": "En_Ligne"},
    "online": {"uri": f"{BASE_URI}En_Ligne", "name": "En_Ligne"},
    "présentiel": {"uri": f"{BASE_URI}Présentiel", "name": "Présentiel"},
    "présentielle": {"uri": f"{BASE_URI}Présentiel", "name": "Présentiel"},
    "in-person": {"uri": f"{BASE_URI}Présentiel", "name": "Présentiel"},
}

# Domain class keywords
CLASS_KEYWORDS = {
    "cours": {"uri": f"{BASE_URI}Cours", "name": "Cours"},
    "course": {"uri": f"{BASE_URI}Cours", "name": "Cours"},
    "courses": {"uri": f"{BASE_URI}Cours", "name": "Cours"},
    "formation": {"uri": f"{BASE_URI}Formation", "name": "Formation"},
    "formations": {"uri": f"{BASE_URI}Formation", "name": "Formation"},
    "étudiant": {"uri": f"{BASE_URI}Etudiant", "name": "Etudiant"},
    "etudiant": {"uri": f"{BASE_URI}Etudiant", "name": "Etudiant"},
    "étudiants": {"uri": f"{BASE_URI}Etudiant", "name": "Etudiant"},
    "etudiants": {"uri": f"{BASE_URI}Etudiant", "name": "Etudiant"},
    "student": {"uri": f"{BASE_URI}Etudiant", "name": "Etudiant"},
    "students": {"uri": f"{BASE_URI}Etudiant", "name": "Etudiant"},
    "enseignant": {"uri": f"{BASE_URI}Enseignant", "name": "Enseignant"},
    "enseignants": {"uri": f"{BASE_URI}Enseignant", "name": "Enseignant"},
    "professeur": {"uri": f"{BASE_URI}Enseignant", "name": "Enseignant"},
    "prof": {"uri": f"{BASE_URI}Enseignant", "name": "Enseignant"},
    "teacher": {"uri": f"{BASE_URI}Enseignant", "name": "Enseignant"},
    "teachers": {"uri": f"{BASE_URI}Enseignant", "name": "Enseignant"},
    "instructor": {"uri": f"{BASE_URI}Enseignant", "name": "Enseignant"},
    "établissement": {"uri": f"{BASE_URI}Établissement", "name": "Établissement"},
    "etablissement": {"uri": f"{BASE_URI}Établissement", "name": "Établissement"},
    "établissements": {"uri": f"{BASE_URI}Établissement", "name": "Établissement"},
    "etablissements": {"uri": f"{BASE_URI}Établissement", "name": "Établissement"},
    "université": {"uri": f"{BASE_URI}Université", "name": "Université"},
    "universite": {"uri": f"{BASE_URI}Université", "name": "Université"},
    "universités": {"uri": f"{BASE_URI}Université", "name": "Université"},
    "university": {"uri": f"{BASE_URI}Université", "name": "Université"},
    "universities": {"uri": f"{BASE_URI}Université", "name": "Université"},
    "compétence": {"uri": f"{BASE_URI}Compétence", "name": "Compétence"},
    "competence": {"uri": f"{BASE_URI}Compétence", "name": "Compétence"},
    "compétences": {"uri": f"{BASE_URI}Compétence", "name": "Compétence"},
    "skill": {"uri": f"{BASE_URI}Compétence", "name": "Compétence"},
    "skills": {"uri": f"{BASE_URI}Compétence", "name": "Compétence"},
    "examen": {"uri": f"{BASE_URI}Examen", "name": "Examen"},
    "examens": {"uri": f"{BASE_URI}Examen", "name": "Examen"},
    "exam": {"uri": f"{BASE_URI}Examen", "name": "Examen"},
    "programme": {"uri": f"{BASE_URI}Programme", "name": "Programme"},
    "program": {"uri": f"{BASE_URI}Programme", "name": "Programme"},
}


class EntityExtractor:
    """Extracts ontology individuals, classes, and modalities from question text."""

    def extract(self, text: str, doc: Optional[Any] = None) -> List[ExtractedEntity]:
        """Extract all recognized domain entities from text."""
        lower = text.lower()
        extracted: List[ExtractedEntity] = []
        seen_names = set()

        # 1. Match multi-word or single-word individuals
        for phrase, meta in sorted(KNOWN_INDIVIDUALS.items(), key=lambda x: -len(x[0])):
            pattern = r"\b" + re.escape(phrase) + r"\b"
            if re.search(pattern, lower):
                if meta["name"] not in seen_names:
                    seen_names.add(meta["name"])
                    extracted.append(
                        ExtractedEntity(
                            text=phrase,
                            entity_type="individual",
                            matched_uri=meta["uri"],
                            matched_name=meta["name"],
                        )
                    )

        # 2. Match modalities (hybride, en ligne, etc.)
        for phrase, meta in sorted(MODALITIES.items(), key=lambda x: -len(x[0])):
            pattern = r"\b" + re.escape(phrase) + r"\b"
            if re.search(pattern, lower):
                if meta["name"] not in seen_names:
                    seen_names.add(meta["name"])
                    extracted.append(
                        ExtractedEntity(
                            text=phrase,
                            entity_type="modality",
                            matched_uri=meta["uri"],
                            matched_name=meta["name"],
                        )
                    )

        # 3. Match ontology classes
        for phrase, meta in sorted(CLASS_KEYWORDS.items(), key=lambda x: -len(x[0])):
            pattern = r"\b" + re.escape(phrase) + r"\b"
            if re.search(pattern, lower):
                if meta["name"] not in seen_names:
                    seen_names.add(meta["name"])
                    extracted.append(
                        ExtractedEntity(
                            text=phrase,
                            entity_type="class",
                            matched_uri=meta["uri"],
                            matched_name=meta["name"],
                        )
                    )

        # 4. Complement with spaCy NER entities if any individual was missed
        if doc is not None:
            for ent in doc.ents:
                ent_clean = ent.text.strip().lower()
                if ent_clean in KNOWN_INDIVIDUALS and KNOWN_INDIVIDUALS[ent_clean]["name"] not in seen_names:
                    meta = KNOWN_INDIVIDUALS[ent_clean]
                    seen_names.add(meta["name"])
                    extracted.append(
                        ExtractedEntity(
                            text=ent.text,
                            entity_type="individual",
                            matched_uri=meta["uri"],
                            matched_name=meta["name"],
                        )
                    )

        return extracted


entity_extractor = EntityExtractor()
