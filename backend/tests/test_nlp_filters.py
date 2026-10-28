"""Unit tests for TALN detailed filter extraction and SPARQL query synthesis."""

import pytest
from app.nlp.entity_extractor import entity_extractor
from app.nlp.intent_recognizer import intent_recognizer
from app.nlp.preprocessor import preprocessor
from app.nlp.sparql_builder import sparql_builder


def test_student_specialite_filter():
    q = "list of students with specialite Informatique"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "LIST_STUDENTS"
    assert "FILTER(CONTAINS(LCASE(STR(?specialite)), \"informatique\"))" in sparql
    assert "informatique" in explanation.lower()


def test_student_statut_filter():
    q = "étudiants avec statut Actif"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "LIST_STUDENTS"
    assert "FILTER(CONTAINS(LCASE(STR(?statut)), \"actif\"))" in sparql


def test_teacher_grade_filter():
    q = "enseignants avec grade Professeur"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "LIST_TEACHERS"
    assert "FILTER(CONTAINS(LCASE(STR(?grade)), \"professeur\"))" in sparql


def test_course_credits_gt_filter():
    q = "cours avec plus de 3 crédits"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "LIST_COURSES"
    assert "FILTER(?credits > 3)" in sparql


def test_course_credits_exact_filter():
    q = "courses with 4 credits"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "LIST_COURSES"
    assert "FILTER(?credits = 4)" in sparql


def test_course_prerequisites_specific():
    q = "Quels sont les prérequis pour le cours Java ?"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "COURSE_PREREQUISITES"
    assert "java" in sparql.lower()


def test_teacher_of_course_dynamic():
    q = "Who teaches Java?"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "TEACHER_OF_COURSE"
    assert "java" in sparql.lower()


def test_competences_linguistique_filter():
    q = "Quelles sont les compétences linguistiques ?"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "LIST_COMPETENCES"
    assert "Compétence_Linguistique" in sparql
    assert "linguistique" in explanation.lower()


def test_competences_niveau_filter():
    q = "Quelles sont les compétences de niveau Intermédiaire ?"
    doc, lang = preprocessor.process(q)
    entities = entity_extractor.extract(q, doc)
    intent = intent_recognizer.recognize(q, entities, lang)
    sparql, explanation = sparql_builder.build(intent, entities, q)

    assert intent == "LIST_COMPETENCES"
    assert "FILTER(CONTAINS(LCASE(STR(?niveau)), \"intermédiaire\"))" in sparql

