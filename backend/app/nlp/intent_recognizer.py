"""Intent recognizer for EduSmart questions.

Classifies natural language questions into deterministic semantic query intents
using syntactic patterns, lemma analysis, and entity associations.
"""

import re
from typing import List
from app.schemas.nlp import ExtractedEntity


class IntentRecognizer:
    """Classifies user queries into semantic query intents."""

    def recognize(self, text: str, entities: List[ExtractedEntity], lang: str = "fr") -> str:
        """Classify question into an intent identifier."""
        lower = text.lower()
        entity_names = {e.matched_name for e in entities if e.matched_name}
        entity_types = {e.entity_type for e in entities}

        # Check for teacher/student entity presence
        has_teacher_entity = any(
            e.matched_name in ["Ali", "Mohamed_Ben_Salah", "Mariem_Trabelsi"]
            for e in entities
        )
        has_student_entity = any(
            e.matched_name in ["ahmed", "Wassim_Frigui", "Yassine_Ben_Ali"]
            for e in entities
        )
        has_course_entity = any(
            e.matched_name in ["java", "Formation_Java", "Intelligence_Artificielle", "Machine_Learning", "Algorithmique_Avancee", "Licence_Informatique"]
            for e in entities
        )

        # 1. Prerequisites for course / formation
        if "prérequis" in lower or "prerequis" in lower or "prerequisite" in lower or "pre-requisite" in lower:
            return "COURSE_PREREQUISITES"

        # 2. Competencies / skills developed
        if (
            "compétence" in lower
            or "competence" in lower
            or "skill" in lower
            or "développ" in lower
            or "develop" in lower
            or "acqui" in lower
        ):
            return "COURSE_SKILLS"

        # 3. Establishments proposing courses / formations (e.g. ESPRIT)
        if ("propos" in lower or "organis" in lower or "offr" in lower or "offer" in lower or "provid" in lower) and (
            "ESPRIT" in entity_names
            or "Établissement" in entity_names
            or "Université" in entity_names
            or "Université_Privée" in entity_names
            or "esprit" in lower
            or "université" in lower
            or "universite" in lower
            or "university" in lower
        ):
            return "COURSES_BY_ESTABLISHMENT"

        # 4. Who teaches a course (e.g. "Qui enseigne Java ?", "Who teaches Machine Learning ?")
        has_who = bool(
            re.search(r"\b(qui|who)\b", lower)
            or re.search(r"\b(quel|quelle|quels|quelles)\s+(enseignant|professeur|prof|teacher|instructor)\b", lower)
            or re.search(r"\bwho\s+(teaches|gives|instructs)\b", lower)
            or re.search(r"\bqui\s+(donne|enseigne)\b", lower)
        )
        if has_who and ("enseign" in lower or "teach" in lower or "cours" in lower or "course" in lower or has_course_entity):
            return "TEACHER_OF_COURSE"

        # 5. Courses taught by a teacher (e.g. "Quels cours sont enseignés par Ali ?", "Courses taught by Mohamed")
        is_courses_by_teacher = bool(
            re.search(r"\b(enseign[ée]s?\s+par|taught\s+by|dispens[ée]s?\s+par)\b", lower)
            or (has_teacher_entity and ("cours" in lower or "course" in lower or "matière" in lower or "matiere" in lower))
        )
        if is_courses_by_teacher:
            return "COURSES_BY_TEACHER"

        # 6. Student enrollment / establishment (e.g. "Où étudie Ahmed ?", "Quel programme suit Ahmed ?", "Where does Ahmed study?")
        is_student_enrollment = bool(
            re.search(r"\b(programme\s+(suit|suivi|de)|what\s+program|where\s+does.*study|o[ùu]\s+[ée]tudie)\b", lower)
            or (has_student_entity and ("suit" in lower or "programm" in lower or "appartien" in lower or "étudi" in lower or "study" in lower or "inscrit" in lower))
        )
        if is_student_enrollment:
            return "STUDENT_ENROLLMENT"

        # 7. Formations by modality (e.g. "Quelles sont les formations hybrides ?", "Show online courses")
        if any(e.entity_type == "modality" for e in entities) or "hybride" in lower or "hybrid" in lower or "en ligne" in lower or "online" in lower or "présentiel" in lower or "in-person" in lower:
            return "FORMATIONS_BY_MODALITY"

        # 8. Exam details
        if "examen" in lower or "exam" in lower or "score" in lower or "note" in lower or "évaluation" in lower or "evaluation" in lower:
            return "EXAM_DETAILS"

        # 9. List specific classes with optional attribute filters
        if "étudiant" in lower or "etudiant" in lower or "student" in lower:
            return "LIST_STUDENTS"

        if (
            "enseignant" in lower
            or "professeur" in lower
            or "prof" in lower
            or "teacher" in lower
            or "instructor" in lower
            or "faculty" in lower
        ):
            return "LIST_TEACHERS"

        if (
            "établissement" in lower
            or "etablissement" in lower
            or "université" in lower
            or "universite" in lower
            or "university" in lower
            or "school" in lower
        ):
            return "LIST_ESTABLISHMENTS"

        if "cours" in lower or "course" in lower or "formation" in lower or "training" in lower or "matière" in lower:
            return "LIST_COURSES"

        # Default fallback
        return "GENERAL_SEARCH"


intent_recognizer = IntentRecognizer()
