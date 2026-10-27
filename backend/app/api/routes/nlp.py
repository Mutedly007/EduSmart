"""API endpoints for the TALN / NLP-to-SPARQL translation subsystem."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.nlp.translator import nlp_translator
from app.schemas.nlp import NlpQueryRequest, NlpQueryResponse, SampleQuestion

router = APIRouter(prefix="/nlp", tags=["TALN & Natural Language Querying"])


@router.post(
    "/query",
    response_model=NlpQueryResponse,
    summary="Ask a question in natural language (TALN)",
    description=(
        "Translates questions in French or English into valid SPARQL 1.1 queries "
        "using deterministic linguistic rules with spaCy and executes them against Fuseki."
    ),
)
async def ask_question(request: NlpQueryRequest) -> NlpQueryResponse:
    """Translate natural language to SPARQL and optionally execute."""
    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question string cannot be empty.",
        )

    response = await nlp_translator.translate_and_execute(
        question=request.question,
        execute=request.execute,
    )
    return response


@router.get(
    "/sample-questions",
    response_model=List[SampleQuestion],
    summary="Get curated sample natural language questions",
    description="Returns list of supported demo questions in French and English for the UI.",
)
async def get_sample_questions(
    lang: Optional[str] = Query(None, description="Optional language filter ('fr' or 'en')")
) -> List[SampleQuestion]:
    """Return sample questions to guide users in asking queries."""
    return nlp_translator.get_sample_questions(lang)
