"""Master TALN / NLP-to-SPARQL translation orchestrator.

Coordinates linguistic preprocessing, intent classification, entity extraction,
SPARQL template synthesis, and optional Fuseki execution.
"""

import logging
import time
from typing import Any, Dict, List, Optional

from app.nlp.entity_extractor import entity_extractor
from app.nlp.intent_recognizer import intent_recognizer
from app.nlp.preprocessor import preprocessor
from app.nlp.sparql_builder import sparql_builder
from app.schemas.nlp import ExtractedEntity, NlpQueryResponse, SampleQuestion
from app.services.sparql_service import sparql_service

logger = logging.getLogger("edusmart.nlp.translator")

# Curated sample questions in French and English
SAMPLE_QUESTIONS: List[SampleQuestion] = [
    SampleQuestion(
        category="Établissements & Offre",
        language="fr",
        question="Quels sont les cours proposés par ESPRIT ?",
        description="Trouve les formations et programmes académiques proposés par l'université ESPRIT.",
    ),
    SampleQuestion(
        category="Enseignants & Pédagogie",
        language="fr",
        question="Qui enseigne le cours de Java ?",
        description="Identifie l'enseignant responsable du cours pratique de Java.",
    ),
    SampleQuestion(
        category="Enseignants & Pédagogie",
        language="fr",
        question="Quels cours sont enseignés par Ali ?",
        description="Liste l'ensemble des matières dispensées par Ali.",
    ),
    SampleQuestion(
        category="Étudiants & Parcours",
        language="fr",
        question="Quel programme suit Ahmed ?",
        description="Affiche le programme académique et l'université d'appartenance d'Ahmed.",
    ),
    SampleQuestion(
        category="Modalités d'Apprentissage",
        language="fr",
        question="Quelles sont les formations hybrides ?",
        description="Filtre les formations dispensées en mode hybride.",
    ),
    SampleQuestion(
        category="Compétences & Prérequis",
        language="fr",
        question="Quels sont les prérequis pour le cours Java ?",
        description="Trouve les prérequis et compétences nécessaires avant de suivre Java.",
    ),
    SampleQuestion(
        category="Compétences & Prérequis",
        language="fr",
        question="Quelles compétences développe le cours Java ?",
        description="Affiche les compétences acquises grâce au cours Java.",
    ),
    SampleQuestion(
        category="Examens & Évaluations",
        language="fr",
        question="Quels sont les examens et leurs scores ?",
        description="Détaille les sessions d'examen et les notes associées.",
    ),
    SampleQuestion(
        category="Universities & Offer",
        language="en",
        question="Which courses are offered by ESPRIT?",
        description="Lists programs and training courses organized by ESPRIT.",
    ),
    SampleQuestion(
        category="Faculty",
        language="en",
        question="Who teaches Java?",
        description="Finds the instructor for Java course.",
    ),
    SampleQuestion(
        category="Training Modalities",
        language="en",
        question="Show me all hybrid formations",
        description="Filters training courses with hybrid teaching modalities.",
    ),
]


class NlpSparqlTranslator:
    """End-to-end TALN question translator and query dispatcher."""

    async def translate_and_execute(
        self, question: str, execute: bool = True
    ) -> NlpQueryResponse:
        """Translate a natural language question into SPARQL and execute it.

        Args:
            question: The user query string in French or English.
            execute: If True, dispatches the generated query to Fuseki/RDFLib.

        Returns:
            NlpQueryResponse containing translation details and result records.
        """
        t0 = time.perf_counter()

        try:
            # 1. Linguistic Preprocessing & Language Detection
            doc, lang = preprocessor.process(question)

            # 2. Domain Entity Extraction
            entities = entity_extractor.extract(question, doc)

            # 3. Intent Classification
            intent = intent_recognizer.recognize(question, entities, lang)

            # 4. SPARQL Query Generation
            sparql_query, explanation = sparql_builder.build(intent, entities, question)

            records: Optional[List[Dict[str, Any]]] = None
            total_records = 0
            execution_source = "translation_only"
            exec_error = None

            # 5. Optional Query Execution against Fuseki / RDFLib
            if execute:
                res = await sparql_service.execute_query(sparql_query)
                if res.get("success"):
                    records = res.get("records", [])
                    total_records = len(records)
                    execution_source = res.get("source", "fuseki")
                else:
                    exec_error = res.get("error")
                    execution_source = "failed"

            elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)

            return NlpQueryResponse(
                success=exec_error is None,
                question=question,
                language=lang,
                intent=intent,
                entities=entities,
                sparql_query=sparql_query,
                explanation=explanation,
                records=records,
                total_records=total_records,
                execution_source=execution_source,
                processing_time_ms=elapsed_ms,
                error=exec_error,
            )

        except Exception as e:
            elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)
            logger.error("NLP translation pipeline error: %s", e, exc_info=True)
            return NlpQueryResponse(
                success=False,
                question=question,
                language="unknown",
                intent="ERROR",
                entities=[],
                sparql_query="",
                explanation="Error during linguistic parsing or query construction.",
                records=[],
                total_records=0,
                execution_source="failed",
                processing_time_ms=elapsed_ms,
                error=str(e),
            )

    def get_sample_questions(self, lang: Optional[str] = None) -> List[SampleQuestion]:
        """Return curated sample questions, optionally filtered by language."""
        if lang:
            return [q for q in SAMPLE_QUESTIONS if q.language == lang.lower()]
        return SAMPLE_QUESTIONS


nlp_translator = NlpSparqlTranslator()
