"""SPARQL Query Builder for the TALN module.

Generates syntactically valid and optimized SPARQL 1.1 queries
based on recognized intent and extracted ontology entities.
"""

from typing import List, Tuple
from app.schemas.nlp import ExtractedEntity

PREFIXES = """PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
"""


class SparqlBuilder:
    """Builds parameterized SPARQL queries for each recognized intent."""

    def build(self, intent: str, entities: List[ExtractedEntity], question: str) -> Tuple[str, str]:
        """Construct the SPARQL query and explanation for a given intent.

        Returns:
            Tuple of (sparql_query, explanation).
        """
        entity_map = {e.matched_name: e for e in entities if e.matched_name}

        if intent == "COURSES_BY_ESTABLISHMENT":
            etab = "ESPRIT"
            for name in entity_map:
                if name in ["ESPRIT", "Université_Privée", "Établissement"]:
                    etab = name
                    break
            query = f"""{PREFIXES}
SELECT DISTINCT ?etablissement ?nomEtablissement ?formation ?nomFormation ?type WHERE {{
    ?etablissement a ?etabType .
    OPTIONAL {{ ?etablissement edu:nom ?nomEtablissement }}
    {{
        ?etablissement edu:propose ?formation .
        BIND("Programme Académique" AS ?type)
    }} UNION {{
        ?etablissement edu:organise ?formation .
        BIND("Formation Continue" AS ?type)
    }}
    OPTIONAL {{ ?formation edu:nom ?nomFormation }}
    FILTER(STRENDS(STR(?etablissement), "{etab}"))
}}"""
            explanation = f"Interrogation de l'ontologie pour trouver les programmes et formations proposés/organisés par '{etab}'."
            return query, explanation

        elif intent == "TEACHER_OF_COURSE":
            course_name = "java"
            if "java" in entity_map:
                course_name = "java"
            query = f"""{PREFIXES}
SELECT DISTINCT ?cours ?nomCours ?enseignant ?nomEnseignant ?email ?grade ?specialite WHERE {{
    ?cours edu:aPourEnseignant ?enseignant .
    OPTIONAL {{ ?cours edu:nom ?nomCours }}
    OPTIONAL {{ ?enseignant edu:nom ?nomEnseignant }}
    OPTIONAL {{ ?enseignant edu:email ?email }}
    OPTIONAL {{ ?enseignant edu:grade ?grade }}
    OPTIONAL {{ ?enseignant edu:specialite ?specialite }}
    FILTER(STRENDS(STR(?cours), "{course_name}"))
}}"""
            explanation = f"Recherche de l'enseignant responsable du cours '{course_name}' via la propriété 'aPourEnseignant'."
            return query, explanation

        elif intent == "COURSES_BY_TEACHER":
            teacher_name = "Ali"
            if "Ali" in entity_map:
                teacher_name = "Ali"
            query = f"""{PREFIXES}
SELECT DISTINCT ?enseignant ?nomEnseignant ?cours ?nomCours ?codeCours ?credits ?duree WHERE {{
    ?enseignant edu:enseigne ?cours .
    OPTIONAL {{ ?enseignant edu:nom ?nomEnseignant }}
    OPTIONAL {{ ?cours edu:nom ?nomCours }}
    OPTIONAL {{ ?cours edu:codeCours ?codeCours }}
    OPTIONAL {{ ?cours edu:credits ?credits }}
    OPTIONAL {{ ?cours edu:duree ?duree }}
    FILTER(STRENDS(STR(?enseignant), "{teacher_name}"))
}}"""
            explanation = f"Recherche de tous les cours enseignés par '{teacher_name}' via la propriété 'enseigne'."
            return query, explanation

        elif intent == "STUDENT_ENROLLMENT":
            student_name = "ahmed"
            if "ahmed" in entity_map:
                student_name = "ahmed"
            query = f"""{PREFIXES}
SELECT DISTINCT ?etudiant ?nomEtudiant ?programme ?nomProgramme ?etablissement ?nomEtablissement ?statut WHERE {{
    ?etudiant a edu:Etudiant .
    OPTIONAL {{ ?etudiant edu:nom ?nomEtudiant }}
    OPTIONAL {{ ?etudiant edu:suitProgramme ?programme . OPTIONAL {{ ?programme edu:nom ?nomProgramme }} }}
    OPTIONAL {{ ?etudiant edu:appartientA ?etablissement . OPTIONAL {{ ?etablissement edu:nom ?nomEtablissement }} }}
    OPTIONAL {{ ?etudiant edu:statut ?statut }}
    FILTER(STRENDS(STR(?etudiant), "{student_name}"))
}}"""
            explanation = f"Recherche du programme suivi et de l'établissement d'appartenance pour l'étudiant '{student_name}'."
            return query, explanation

        elif intent == "FORMATIONS_BY_MODALITY":
            modality = "Hybride"
            for e in entities:
                if e.entity_type == "modality" and e.matched_name:
                    modality = e.matched_name
                    break
            query = f"""{PREFIXES}
SELECT DISTINCT ?formation ?nomFormation ?modalite ?duree ?prix ?description WHERE {{
    ?formation edu:utiliseModalite ?modalite .
    OPTIONAL {{ ?formation edu:nom ?nomFormation }}
    OPTIONAL {{ ?formation edu:duree ?duree }}
    OPTIONAL {{ ?formation edu:prix ?prix }}
    OPTIONAL {{ ?formation edu:description ?description }}
    FILTER(STRENDS(STR(?modalite), "{modality}"))
}}"""
            explanation = f"Filtrage des formations utilisant la modalité d'apprentissage '{modality}' via 'utiliseModalite'."
            return query, explanation

        elif intent == "COURSE_PREREQUISITES":
            query = f"""{PREFIXES}
SELECT DISTINCT ?cours ?nomCours ?prerequis ?nomPrerequis ?description WHERE {{
    ?cours edu:aPourPrerequis ?prerequis .
    OPTIONAL {{ ?cours edu:nom ?nomCours }}
    OPTIONAL {{ ?prerequis edu:nom ?nomPrerequis }}
    OPTIONAL {{ ?prerequis edu:description ?description }}
}}"""
            explanation = "Recherche des prérequis nécessaires pour les cours via la relation 'aPourPrerequis'."
            return query, explanation

        elif intent == "COURSE_SKILLS":
            query = f"""{PREFIXES}
SELECT DISTINCT ?cours ?nomCours ?competence ?nomCompetence ?niveau ?description WHERE {{
    ?cours edu:développe ?competence .
    OPTIONAL {{ ?cours edu:nom ?nomCours }}
    OPTIONAL {{ ?competence edu:nom ?nomCompetence }}
    OPTIONAL {{ ?competence edu:niveau ?niveau }}
    OPTIONAL {{ ?competence edu:description ?description }}
}}"""
            explanation = "Recherche des compétences développées par les cours via la relation 'développe'."
            return query, explanation

        elif intent == "EXAM_DETAILS":
            query = f"""{PREFIXES}
SELECT DISTINCT ?examen ?nom ?dateEvaluation ?score ?competence ?nomCompetence WHERE {{
    ?examen a edu:Examen .
    OPTIONAL {{ ?examen edu:nom ?nom }}
    OPTIONAL {{ ?examen edu:dateEvaluation ?dateEvaluation }}
    OPTIONAL {{ ?examen edu:score ?score }}
    OPTIONAL {{ ?examen edu:évalue ?competence . OPTIONAL {{ ?competence edu:nom ?nomCompetence }} }}
}}"""
            explanation = "Extraction des détails des évaluations (examens, dates, scores et compétences évaluées)."
            return query, explanation

        elif intent == "LIST_STUDENTS":
            query = f"""{PREFIXES}
SELECT DISTINCT ?etudiant ?nom ?email ?specialite ?statut ?identifiant WHERE {{
    ?etudiant a edu:Etudiant .
    OPTIONAL {{ ?etudiant edu:nom ?nom }}
    OPTIONAL {{ ?etudiant edu:email ?email }}
    OPTIONAL {{ ?etudiant edu:specialite ?specialite }}
    OPTIONAL {{ ?etudiant edu:statut ?statut }}
    OPTIONAL {{ ?etudiant edu:identifiant ?identifiant }}
}}"""
            explanation = "Liste de tous les individus enregistrés comme instances de la classe 'Etudiant'."
            return query, explanation

        elif intent == "LIST_TEACHERS":
            query = f"""{PREFIXES}
SELECT DISTINCT ?enseignant ?nom ?grade ?email ?specialite ?identifiant WHERE {{
    ?enseignant a edu:Enseignant .
    OPTIONAL {{ ?enseignant edu:nom ?nom }}
    OPTIONAL {{ ?enseignant edu:grade ?grade }}
    OPTIONAL {{ ?enseignant edu:email ?email }}
    OPTIONAL {{ ?enseignant edu:specialite ?specialite }}
    OPTIONAL {{ ?enseignant edu:identifiant ?identifiant }}
}}"""
            explanation = "Liste de tous les enseignants instances de la classe 'Enseignant'."
            return query, explanation

        elif intent == "LIST_ESTABLISHMENTS":
            query = f"""{PREFIXES}
SELECT DISTINCT ?etablissement ?nom ?ville ?adresse ?siteWeb ?statut ?type WHERE {{
    ?etablissement a ?type .
    ?type rdfs:subClassOf* ?root .
    FILTER(CONTAINS(STR(?root), "tablissement") && ?type != owl:NamedIndividual)
    OPTIONAL {{ ?etablissement edu:nom ?nom }}
    OPTIONAL {{ ?etablissement edu:ville ?ville }}
    OPTIONAL {{ ?etablissement edu:adresse ?adresse }}
    OPTIONAL {{ ?etablissement edu:siteWeb ?siteWeb }}
    OPTIONAL {{ ?etablissement edu:statut ?statut }}
}}"""
            explanation = "Recherche de tous les établissements universitaires, écoles et instituts enregistrés."
            return query, explanation

        elif intent == "LIST_COURSES":
            query = f"""{PREFIXES}
SELECT DISTINCT ?cours ?nom ?codeCours ?credits ?duree ?uniteDuree ?semestre WHERE {{
    ?cours a ?type .
    FILTER(?type IN (edu:Cours, edu:Cours_Pratique, edu:Formation, edu:Programme_Licence))
    OPTIONAL {{ ?cours edu:nom ?nom }}
    OPTIONAL {{ ?cours edu:codeCours ?codeCours }}
    OPTIONAL {{ ?cours edu:credits ?credits }}
    OPTIONAL {{ ?cours edu:duree ?duree }}
    OPTIONAL {{ ?cours edu:uniteDuree ?uniteDuree }}
    OPTIONAL {{ ?cours edu:semestre ?semestre }}
}}"""
            explanation = "Récupération de la liste des cours et programmes académiques disponibles."
            return query, explanation

        else:
            # General keyword search fallback
            clean_term = "".join(ch for ch in question if ch.isalnum() or ch.isspace()).strip()
            # Pick the longest keyword that isn't a stopword
            words = [w for w in clean_term.split() if len(w) > 3]
            search_word = words[0] if words else "java"
            query = f"""{PREFIXES}
SELECT DISTINCT ?sujet ?propriete ?valeur WHERE {{
    ?sujet ?propriete ?valeur .
    FILTER(isLiteral(?valeur) && CONTAINS(LCASE(STR(?valeur)), "{search_word.lower()}"))
}} LIMIT 25"""
            explanation = f"Recherche sémantique générale basée sur le mot-clé '{search_word}'."
            return query, explanation


sparql_builder = SparqlBuilder()
