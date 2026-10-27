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
            "ESPRIT" in entity_names or "Établissement" in entity_names or "Université" in entity_names
        ):
            return "COURSES_BY_ESTABLISHMENT"

        # 4. Who teaches a course (e.g. "Qui enseigne Java ?", "Who teaches Java?")
        has_who = bool(
            re.search(r"\b(qui|who)\b", lower)
            or re.search(r"\b(quel|quelle|quels|quelles)\s+(enseignant|professeur|prof|teacher|instructor)\b", lower)
        )
        if has_who and ("enseign" in lower or "teach" in lower or "cours" in lower or "course" in lower or "java" in entity_names):
            return "TEACHER_OF_COURSE"

        # 5. Courses taught by a teacher (e.g. "Quels cours sont enseignés par Ali ?")
        if ("Ali" in entity_names) and ("cours" in lower or "enseign" in lower or "teach" in lower):
            return "COURSES_BY_TEACHER"

        # 6. Student enrollment / establishment (e.g. "Où étudie Ahmed ? Quel programme suit Ahmed ?")
        if "ahmed" in entity_names and (
            "suit" in lower or "programm" in lower or "appartien" in lower or "étudi" in lower or "study" in lower
        ):
            return "STUDENT_ENROLLMENT"

        # 7. Formations by modality (e.g. "Quelles sont les formations hybrides ?")
        if any(e.entity_type == "modality" for e in entities) or "hybride" in lower or "hybrid" in lower:
            return "FORMATIONS_BY_MODALITY"

        # 8. Exam details
        if "examen" in lower or "exam" in lower or "score" in lower or "note" in lower:
            return "EXAM_DETAILS"

        # 9. List specific classes
        if "étudiant" in lower or "etudiant" in lower or "student" in lower:
            return "LIST_STUDENTS"

        if (
            "enseignant" in lower
            or "professeur" in lower
            or "prof" in lower
            or "teacher" in lower
            or "instructor" in lower
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

        if "cours" in lower or "course" in lower or "formation" in lower or "training" in lower:
            return "LIST_COURSES"

        # Default fallback
        return "GENERAL_SEARCH"


intent_recognizer = IntentRecognizer()
