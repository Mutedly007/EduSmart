# EduSmart NLP / TALN Module (`app/nlp`)

## Overview

This module is reserved for the custom Natural Language Processing / Traitement Automatique du Langage Naturel (TALN) translation subsystem for EduSmart.

Its future goal is to translate user questions asked in natural language (e.g., *"What are the prerequisites for Machine Learning?"* or *"Which certifications require Python?"*) into syntactically valid and executable SPARQL 1.1 queries targeted at the EduSmart ontology.

## Architecture & Design Principles

### 1. Strict Non-LLM Architecture Policy
Per the university Web Semantics project requirements, **no external, hosted, or generative LLMs (such as OpenAI GPT, Google Gemini, Anthropic Claude, etc.) will be integrated for SPARQL generation**.
All question understanding and query generation must rely strictly on:
- Local NLP/TALN linguistic analysis using **spaCy**.
- Controlled semantic grammar rules, dependency parse trees, and vocabulary mapping.
- Deterministic ontology concept alignment.

### 2. Planned Pipeline Stages (Phase 2+)

1. **Linguistic Processing (`preprocessor.py`)**:
   - Tokenization, lemmatization, Part-of-Speech (POS) tagging, and dependency parsing using spaCy (e.g. `en_core_web_sm`).
   - Stopword filtering and punctuation normalization tailored to question structures.

2. **Intent & Entity Extraction (`intent_recognizer.py`, `entity_extractor.py`)**:
   - Classification of query intent: e.g., `FIND_COURSES`, `CHECK_PREREQUISITES`, `LIST_COMPETENCIES`, `FIND_INSTRUCTORS`.
   - Extraction of domain entities (course names, skill keywords, level indicators, prerequisite indicators).

3. **Ontology Concept Mapping (`concept_mapper.py`)**:
   - Matching extracted tokens and lemmatized forms to URIs in the EduSmart ontology (e.g., mapping `"Machine Learning"` to `edu:MachineLearningCourse` or `edu:Course` with `rdfs:label`).
   - Disambiguation using ontology hierarchy and synonyms.

4. **SPARQL Query Construction (`sparql_builder.py`)**:
   - Dynamic assembly of SPARQL SELECT / ASK / FILTER query templates based on the recognized intent and mapped entities.
   - Syntax validation using RDFLib query parser before dispatching to Apache Jena Fuseki.

## Phase 1 Status

- Dependencies declared (`spacy>=3.8.0`).
- No automatic model downloads performed during environment initialization.
- No dummy or fabricated SPARQL outputs returned.
- Actual translation logic will be implemented in subsequent project phases.
