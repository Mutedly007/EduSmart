"""SPARQL Query Builder for the TALN module.

Generates syntactically valid and optimized SPARQL 1.1 queries
based on recognized intent, extracted ontology entities, and detailed attribute filters.
"""

import re
from typing import Any, Dict, List, Tuple
from app.schemas.nlp import ExtractedEntity

PREFIXES = """PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
"""


class SparqlBuilder:
    """Builds parameterized SPARQL queries for each recognized intent with dynamic filter injection."""

    def _extract_filters(self, question: str, entities: List[ExtractedEntity]) -> Dict[str, Any]:
        """Extract detailed attribute filters and target entity identifiers from natural language query."""
        filters: Dict[str, Any] = {}
        lower = question.lower()
        entity_map = {e.matched_name: e for e in entities if e.matched_name}

        # 1. Specialite filter (e.g. "specialite Informatique", "spécialité Génie Logiciel", "en Informatique")
        spec_match = re.search(
            r"\b(?:sp[ée]cialit[ée]|specialty|speciality|specialite)\b\s*(?:\b(?:est|en|in|with|de|is)\b|[:=])?\s*(?P<val>[a-zA-Z0-9_à-ÿÀ-Ý]+(?:\s+[a-zA-Z0-9_à-ÿÀ-Ý]+)?)",
            question,
            re.IGNORECASE,
        )
        if spec_match:
            filters["specialite"] = spec_match.group("val").strip()
        else:
            spec_fallback = re.search(
                r"\b(?:en|in)\s+(informatique|programmation|g[ée]nie logiciel|intelligence artificielle|ia|data science|r[ée]seaux|cybersecurit[ée])\b",
                lower,
            )
            if spec_fallback:
                filters["specialite"] = spec_fallback.group(1).strip()

        # 2. Statut filter (e.g. "statut Actif", "status Active", "actifs", "inscrits", "privé")
        stat_match = re.search(
            r"\b(?:statut|status)\b\s*(?:\b(?:est|en|in|with|de|is)\b|[:=])?\s*(?P<val>[a-zA-Z0-9_à-ÿÀ-Ý]+)",
            question,
            re.IGNORECASE,
        )
        if stat_match:
            filters["statut"] = stat_match.group("val").strip()
        elif re.search(r"\b(actifs?|active)\b", lower):
            filters["statut"] = "Actif"
        elif re.search(r"\b(inscrits?|enrolled)\b", lower):
            filters["statut"] = "Inscrit"
        elif re.search(r"\b(dipl[ôo]m[ée]s?|graduated)\b", lower):
            filters["statut"] = "Diplômé"
        elif re.search(r"\b(priv[ée]s?|private)\b", lower):
            filters["statut"] = "Privé"
        elif re.search(r"\b(publics?|public)\b", lower):
            filters["statut"] = "Public"

        # 3. Grade filter (e.g. "grade Professeur", "professeur titulaire", "maître assistant")
        grade_match = re.search(
            r"\b(?:grade|rank|titre)\b\s*(?:\b(?:est|en|in|with|de|is)\b|[:=])?\s*(?P<val>[a-zA-Z0-9_à-ÿÀ-Ý]+(?:\s+[a-zA-Z0-9_à-ÿÀ-Ý]+)?)",
            question,
            re.IGNORECASE,
        )
        if grade_match:
            filters["grade"] = grade_match.group("val").strip()
        elif re.search(r"\bprofesseur\s+titulaire\b", lower):
            filters["grade"] = "professeur titulaire"
        elif re.search(r"\bma[îi]tre\s+assistant\b", lower):
            filters["grade"] = "maître assistant"
        elif re.search(r"\bprofesseur\b", lower) and not re.search(
            r"\b(liste|list|quels?|quelles?|tous|all|show)\s+(?:des?\s+|the\s+)?professeurs?\b", lower
        ):
            filters["grade"] = "Professeur"

        # 4. Name / Nom filter (e.g. "nommé Ahmed", "named Wassim", "nom Ali")
        nom_match = re.search(
            r"\b(?:nomm[ée]|named|appel[ée]|nom|name)\b\s*(?:\b(?:est|in|with|de|is)\b|[:=])?\s*(?P<val>[a-zA-Z0-9_à-ÿÀ-Ý]+(?:\s+[a-zA-Z0-9_à-ÿÀ-Ý]+)?)",
            question,
            re.IGNORECASE,
        )
        if nom_match:
            filters["nom"] = nom_match.group("val").strip()

        # 5. Credits filter (e.g. "plus de 3 crédits", "more than 3 credits", "4 crédits", "with 4 credits")
        cred_gt = re.search(
            r"\b(?:plus\s+de|more\s+than|>|sup[ée]rieur\s+[àa])\s*(\d+)\s*(?:cr[ée]dits?|credits?|ects)?\b",
            lower,
        )
        cred_lt = re.search(
            r"\b(?:moins\s+de|less\s+than|<|inf[ée]rieur\s+[àa])\s*(\d+)\s*(?:cr[ée]dits?|credits?|ects)?\b",
            lower,
        )
        cred_eq = re.search(
            r"\b(?:avec|with|=)?\s*(\d+)\s*(?:cr[ée]dits?|credits?|ects)\b",
            lower,
        )

        if cred_gt and re.search(r"cr[ée]dits?|credits?|ects", lower):
            filters["credits"] = (">", int(cred_gt.group(1)))
        elif cred_lt and re.search(r"cr[ée]dits?|credits?|ects", lower):
            filters["credits"] = ("<", int(cred_lt.group(1)))
        elif cred_eq:
            filters["credits"] = ("=", int(cred_eq.group(1)))

        # 6. Duration / Hours filter (e.g. "plus de 40 heures", "> 30h", "60 heures")
        dur_gt = re.search(
            r"\b(?:plus\s+de|more\s+than|>|sup[ée]rieur\s+[àa])\s*(\d+(?:\.\d+)?)\s*(?:heures?|hours?|h)\b",
            lower,
        )
        dur_lt = re.search(
            r"\b(?:moins\s+de|less\s+than|<|inf[ée]rieur\s+[àa])\s*(\d+(?:\.\d+)?)\s*(?:heures?|hours?|h)\b",
            lower,
        )
        dur_eq = re.search(
            r"\b(?:avec|with|=)?\s*(\d+(?:\.\d+)?)\s*(?:heures?|hours?|h)\b",
            lower,
        )

        if dur_gt:
            filters["duree"] = (">", float(dur_gt.group(1)))
        elif dur_lt:
            filters["duree"] = ("<", float(dur_lt.group(1)))
        elif dur_eq:
            filters["duree"] = ("=", float(dur_eq.group(1)))

        # 7. City / Ville filter (e.g. "à Ariana", "in Tunis", "ville Tunis")
        ville_match = re.search(
            r"\b(?:ville|city)\b\s*(?:\b(?:est|in|de|is)\b|[:=])?\s*(?P<val>[a-zA-Z0-9_à-ÿÀ-Ý]+)",
            question,
            re.IGNORECASE,
        )
        if ville_match:
            filters["ville"] = ville_match.group("val").strip()
        else:
            ville_kw = re.search(
                r"\b(?:[àa]|in)\s+(Ariana|Tunis|Sousse|Sfax|Nabeul|Monastir|Bizerte)\b",
                question,
                re.IGNORECASE,
            )
            if ville_kw:
                filters["ville"] = ville_kw.group(1).strip()

        # 8. Score filter (e.g. "score > 10", "note supérieure à 15", "score 15.5")
        score_gt = re.search(
            r"\b(?:score|note)\b\s*(?:>|sup[ée]rieur\s+[àa]|plus\s+de|above)\s*(\d+(?:\.\d+)?)",
            lower,
        )
        score_lt = re.search(
            r"\b(?:score|note)\b\s*(?:<|inf[ée]rieur\s+[àa]|moins\s+de|below)\s*(\d+(?:\.\d+)?)",
            lower,
        )
        score_eq = re.search(
            r"\b(?:score|note)\b\s*(?:=|de|\:)?\s*(\d+(?:\.\d+)?)",
            lower,
        )

        if score_gt:
            filters["score"] = (">", float(score_gt.group(1)))
        elif score_lt:
            filters["score"] = ("<", float(score_lt.group(1)))
        elif score_eq:
            filters["score"] = ("=", float(score_eq.group(1)))

        # 9. Dynamic course name detection
        course_candidates = [
            ("java", "java"),
            ("formation java", "Formation_Java"),
            ("intelligence artificielle", "Intelligence_Artificielle"),
            ("ia", "Intelligence_Artificielle"),
            ("machine learning", "Machine_Learning"),
            ("algorithmique avancée", "Algorithmique_Avancee"),
            ("algorithmique avancee", "Algorithmique_Avancee"),
            ("licence informatique", "Licence_Informatique"),
        ]
        for phrase, c_id in course_candidates:
            if c_id in entity_map or re.search(r"\b" + re.escape(phrase) + r"\b", lower):
                filters["target_course"] = c_id
                break

        # 10. Dynamic teacher name detection
        teacher_candidates = [
            ("ali", "Ali"),
            ("mohamed ben salah", "Mohamed_Ben_Salah"),
            ("mohamed", "Mohamed_Ben_Salah"),
            ("mariem trabelsi", "Mariem_Trabelsi"),
            ("mariem", "Mariem_Trabelsi"),
        ]
        for phrase, t_id in teacher_candidates:
            if t_id in entity_map or re.search(r"\b" + re.escape(phrase) + r"\b", lower):
                filters["target_teacher"] = t_id
                break

        # 11. Dynamic student name detection
        student_candidates = [
            ("ahmed", "ahmed"),
            ("wassim frigui", "Wassim_Frigui"),
            ("wassim", "Wassim_Frigui"),
            ("yassine ben ali", "Yassine_Ben_Ali"),
            ("yassine", "Yassine_Ben_Ali"),
        ]
        for phrase, s_id in student_candidates:
            if s_id in entity_map or re.search(r"\b" + re.escape(phrase) + r"\b", lower):
                filters["target_student"] = s_id
                break

        # 12. Dynamic establishment detection
        if "ESPRIT" in entity_map or re.search(r"\besprit\b", lower):
            filters["target_establishment"] = "ESPRIT"

        # 13. Competence level / Niveau (e.g. "niveau Débutant", "niveau Intermédiaire", "niveau Avancé", "level Beginner", "intermediate")
        niveau_match = re.search(
            r"\b(?:niveau|level)\b\s*(?:\b(?:est|en|in|with|de|is)\b|[:=])?\s*(?P<val>[a-zA-Z0-9_à-ÿÀ-Ý]+)",
            question,
            re.IGNORECASE,
        )
        if niveau_match:
            filters["niveau"] = niveau_match.group("val").strip()
        elif re.search(r"\b(d[ée]butants?|beginner|beginners)\b", lower):
            filters["niveau"] = "Débutant"
        elif re.search(r"\b(interm[ée]diaires?|intermediate)\b", lower):
            filters["niveau"] = "Intermédiaire"
        elif re.search(r"\b(avanc[ée]s?|advanced)\b", lower):
            filters["niveau"] = "Avancé"

        # 14. Competence category (Linguistique, Technique, Transversale)
        if re.search(r"\b(linguistiques?|linguistic|langues?|languages?|anglais|english|fran[çc]ais|french)\b", lower):
            filters["competence_category"] = "Linguistique"
        elif re.search(r"\b(techniques?|technical|programmation|informatique)\b", lower) and not re.search(r"\b(cours|formation)\b", lower):
            filters["competence_category"] = "Technique"
        elif re.search(r"\b(transversales?|transversal|soft\s*skills?|collaboration|communication|organisation)\b", lower):
            filters["competence_category"] = "Transversale"

        # 15. Domain / Domaine
        dom_match = re.search(
            r"\b(?:domaine|domain)\b\s*(?:\b(?:est|en|in|with|de|is)\b|[:=])?\s*(?P<val>[a-zA-Z0-9_à-ÿÀ-Ý]+)",
            question,
            re.IGNORECASE,
        )
        if dom_match:
            filters["domaine"] = dom_match.group("val").strip()

        # 16. Target skill name detection
        skill_candidates = [
            ("anglais des affaires", "Anglais_Des_Affaires"),
            ("anglais", "Anglais_Des_Affaires"),
            ("algorithmique", "Algorithmique_Individu"),
            ("programmation", "Programmation_Individu"),
            ("python", "Competence_Python"),
            ("ia", "Competence_IA"),
        ]
        for phrase, sk_id in skill_candidates:
            if sk_id in entity_map or re.search(r"\b" + re.escape(phrase) + r"\b", lower):
                # Only set if not already matched as a course or other target
                if not re.search(r"\b(cours|enseignant|étudiant)\s+" + re.escape(phrase), lower):
                    filters["target_skill"] = sk_id
                    break

        return filters

    def build(self, intent: str, entities: List[ExtractedEntity], question: str) -> Tuple[str, str]:
        """Construct the SPARQL query and explanation for a given intent.

        Returns:
            Tuple of (sparql_query, explanation).
        """
        entity_map = {e.matched_name: e for e in entities if e.matched_name}
        filters = self._extract_filters(question, entities)

        if intent == "COURSES_BY_ESTABLISHMENT":
            etab = filters.get("target_establishment", "ESPRIT")
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
    FILTER(CONTAINS(LCASE(STR(?etablissement)), "{etab.lower()}") || CONTAINS(LCASE(STR(?nomEtablissement)), "{etab.lower()}"))
}}"""
            explanation = f"Interrogation de l'ontologie pour trouver les programmes et formations proposés/organisés par '{etab}'."
            return query, explanation

        elif intent == "TEACHER_OF_COURSE":
            course_name = filters.get("target_course", "java")
            query = f"""{PREFIXES}
SELECT DISTINCT ?cours ?nomCours ?enseignant ?nomEnseignant ?email ?grade ?specialite WHERE {{
    ?cours edu:aPourEnseignant ?enseignant .
    OPTIONAL {{ ?cours edu:nom ?nomCours }}
    OPTIONAL {{ ?enseignant edu:nom ?nomEnseignant }}
    OPTIONAL {{ ?enseignant edu:email ?email }}
    OPTIONAL {{ ?enseignant edu:grade ?grade }}
    OPTIONAL {{ ?enseignant edu:specialite ?specialite }}
    FILTER(CONTAINS(LCASE(STR(?cours)), "{course_name.lower()}") || CONTAINS(LCASE(STR(?nomCours)), "{course_name.lower()}"))
}}"""
            explanation = f"Recherche de l'enseignant responsable du cours '{course_name}' via la propriété 'aPourEnseignant'."
            return query, explanation

        elif intent == "COURSES_BY_TEACHER":
            teacher_name = filters.get("target_teacher", "Ali")
            query = f"""{PREFIXES}
SELECT DISTINCT ?enseignant ?nomEnseignant ?cours ?nomCours ?codeCours ?credits ?duree WHERE {{
    ?enseignant edu:enseigne ?cours .
    OPTIONAL {{ ?enseignant edu:nom ?nomEnseignant }}
    OPTIONAL {{ ?cours edu:nom ?nomCours }}
    OPTIONAL {{ ?cours edu:codeCours ?codeCours }}
    OPTIONAL {{ ?cours edu:credits ?credits }}
    OPTIONAL {{ ?cours edu:duree ?duree }}
    FILTER(CONTAINS(LCASE(STR(?enseignant)), "{teacher_name.lower()}") || CONTAINS(LCASE(STR(?nomEnseignant)), "{teacher_name.lower()}"))
}}"""
            explanation = f"Recherche de tous les cours enseignés par '{teacher_name}' via la propriété 'enseigne'."
            return query, explanation

        elif intent == "STUDENT_ENROLLMENT":
            student_name = filters.get("target_student", "ahmed")
            query = f"""{PREFIXES}
SELECT DISTINCT ?etudiant ?nomEtudiant ?programme ?nomProgramme ?etablissement ?nomEtablissement ?statut WHERE {{
    ?etudiant a edu:Etudiant .
    OPTIONAL {{ ?etudiant edu:nom ?nomEtudiant }}
    OPTIONAL {{ ?etudiant edu:suitProgramme ?programme . OPTIONAL {{ ?programme edu:nom ?nomProgramme }} }}
    OPTIONAL {{ ?etudiant edu:appartientA ?etablissement . OPTIONAL {{ ?etablissement edu:nom ?nomEtablissement }} }}
    OPTIONAL {{ ?etudiant edu:statut ?statut }}
    FILTER(CONTAINS(LCASE(STR(?etudiant)), "{student_name.lower()}") || CONTAINS(LCASE(STR(?nomEtudiant)), "{student_name.lower()}"))
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
    FILTER(CONTAINS(LCASE(STR(?modalite)), "{modality.lower()}"))
}}"""
            explanation = f"Filtrage des formations utilisant la modalité d'apprentissage '{modality}' via 'utiliseModalite'."
            return query, explanation

        elif intent == "COURSE_PREREQUISITES":
            target_course = filters.get("target_course")
            course_filter = ""
            if target_course:
                course_filter = f'\n    FILTER(CONTAINS(LCASE(STR(?cours)), "{target_course.lower()}") || CONTAINS(LCASE(STR(?nomCours)), "{target_course.lower()}"))'
                explanation = f"Recherche des prérequis nécessaires pour le cours '{target_course}' via la relation 'aPourPrerequis'."
            else:
                explanation = "Recherche des prérequis nécessaires pour les cours via la relation 'aPourPrerequis'."

            query = f"""{PREFIXES}
SELECT DISTINCT ?cours ?nomCours ?prerequis ?nomPrerequis ?description WHERE {{
    ?cours edu:aPourPrerequis ?prerequis .
    OPTIONAL {{ ?cours edu:nom ?nomCours }}
    OPTIONAL {{ ?prerequis edu:nom ?nomPrerequis }}
    OPTIONAL {{ ?prerequis edu:description ?description }}{course_filter}
}}"""
            return query, explanation

        elif intent == "COURSE_SKILLS":
            target_course = filters.get("target_course")
            target_skill = filters.get("target_skill")
            clauses = []
            expl_parts = ["Recherche des compétences développées par les cours via la relation 'développe'"]

            if target_course:
                clauses.append(f'FILTER(CONTAINS(LCASE(STR(?cours)), "{target_course.lower()}") || CONTAINS(LCASE(STR(?nomCours)), "{target_course.lower()}"))')
                expl_parts.append(f"pour le cours '{target_course}'")

            if target_skill:
                clauses.append(f'FILTER(CONTAINS(LCASE(STR(?competence)), "{target_skill.lower()}") || CONTAINS(LCASE(STR(?nomCompetence)), "{target_skill.lower()}"))')
                expl_parts.append(f"associée à la compétence '{target_skill}'")

            filter_str = ("\n    " + "\n    ".join(clauses)) if clauses else ""

            query = f"""{PREFIXES}
SELECT DISTINCT ?cours ?nomCours ?competence ?nomCompetence ?niveau ?description WHERE {{
    ?cours edu:développe ?competence .
    OPTIONAL {{ ?cours edu:nom ?nomCours }}
    OPTIONAL {{ ?competence edu:nom ?nomCompetence }}
    OPTIONAL {{ ?competence edu:niveau ?niveau }}
    OPTIONAL {{ ?competence edu:description ?description }}{filter_str}
}}"""
            return query, " ".join(expl_parts) + "."

        elif intent == "LIST_COMPETENCES":
            filter_clauses = []
            expl_filters = []

            # 1. Category hierarchy filter (Linguistique, Technique, Transversale)
            cat = filters.get("competence_category")
            if cat == "Linguistique":
                filter_clauses.append("    ?type rdfs:subClassOf* edu:Compétence_Linguistique .")
                expl_filters.append("catégorie Linguistique (langues, compréhension, expression)")
            elif cat == "Technique":
                filter_clauses.append("    ?type rdfs:subClassOf* edu:Compétence_Technique .")
                expl_filters.append("catégorie Technique (informatique, programmation, réseaux)")
            elif cat == "Transversale":
                filter_clauses.append("    ?type rdfs:subClassOf* edu:Compétence_Transversale .")
                expl_filters.append("catégorie Transversale (collaboration, communication, organisation)")
            else:
                filter_clauses.append("    ?type rdfs:subClassOf* edu:Compétence .")

            # 2. Niveau filter (Débutant, Intermédiaire, Avancé)
            if "niveau" in filters:
                niv_val = filters["niveau"]
                filter_clauses.append(
                    f'    ?competence edu:niveau ?niveau .\n    FILTER(CONTAINS(LCASE(STR(?niveau)), "{niv_val.lower()}"))'
                )
                expl_filters.append(f"niveau '{niv_val}'")
            else:
                filter_clauses.append("    OPTIONAL { ?competence edu:niveau ?niveau }")

            # 3. Domaine filter
            if "domaine" in filters:
                dom_val = filters["domaine"]
                filter_clauses.append(
                    f'    ?competence edu:aPourDomaine ?domaine .\n    FILTER(CONTAINS(LCASE(STR(?domaine)), "{dom_val.lower()}"))'
                )
                expl_filters.append(f"domaine '{dom_val}'")
            else:
                filter_clauses.append("    OPTIONAL { ?competence edu:aPourDomaine ?domaine }")

            # 4. Nom filter
            nom_val = filters.get("nom") or filters.get("target_skill")
            if nom_val:
                filter_clauses.append(
                    f'    FILTER(CONTAINS(LCASE(STR(?nom)), "{nom_val.lower()}") || CONTAINS(LCASE(STR(?competence)), "{nom_val.lower()}"))'
                )
                expl_filters.append(f"nom contenant '{nom_val}'")

            clauses_str = "\n".join(filter_clauses)
            query = f"""{PREFIXES}
SELECT DISTINCT ?competence ?nom ?type ?nomType ?niveau ?description ?domaine WHERE {{
    ?competence a ?type .
    FILTER(?type != owl:NamedIndividual && ?type != edu:Compétence)
{clauses_str}
    OPTIONAL {{ ?competence edu:nom ?nom }}
    OPTIONAL {{ ?type rdfs:label ?nomType }}
    OPTIONAL {{ ?competence edu:description ?description }}
}}"""
            if expl_filters:
                explanation = f"Liste des compétences filtrée par: {', '.join(expl_filters)}."
            else:
                explanation = "Liste de toutes les compétences enregistrées dans l'ontologie (techniques, linguistiques, transversales)."
            return query, explanation

        elif intent == "EXAM_DETAILS":
            score_filter = ""
            expl_parts = ["Extraction des détails des évaluations (examens, dates, scores et compétences)"]
            if "score" in filters:
                op, val = filters["score"]
                score_filter = f"\n    ?examen edu:score ?score .\n    FILTER(?score {op} {val})"
                expl_parts.append(f"filtré par score {op} {val}")
            else:
                score_filter = "\n    OPTIONAL { ?examen edu:score ?score }"

            query = f"""{PREFIXES}
SELECT DISTINCT ?examen ?nom ?dateEvaluation ?score ?competence ?nomCompetence WHERE {{
    ?examen a edu:Examen .
    OPTIONAL {{ ?examen edu:nom ?nom }}
    OPTIONAL {{ ?examen edu:dateEvaluation ?dateEvaluation }}{score_filter}
    OPTIONAL {{ ?examen edu:évalue ?competence . OPTIONAL {{ ?competence edu:nom ?nomCompetence }} }}
}}"""
            return query, " ".join(expl_parts) + "."

        elif intent == "LIST_STUDENTS":
            filter_clauses = []
            expl_filters = []

            # 1. Specialite filter
            if "specialite" in filters:
                spec_val = filters["specialite"]
                filter_clauses.append(
                    f'    ?etudiant edu:specialite ?specialite .\n    FILTER(CONTAINS(LCASE(STR(?specialite)), "{spec_val.lower()}"))'
                )
                expl_filters.append(f"spécialité contenant '{spec_val}'")
            else:
                filter_clauses.append("    OPTIONAL { ?etudiant edu:specialite ?specialite }")

            # 2. Statut filter
            if "statut" in filters:
                stat_val = filters["statut"]
                filter_clauses.append(
                    f'    ?etudiant edu:statut ?statut .\n    FILTER(CONTAINS(LCASE(STR(?statut)), "{stat_val.lower()}"))'
                )
                expl_filters.append(f"statut '{stat_val}'")
            else:
                filter_clauses.append("    OPTIONAL { ?etudiant edu:statut ?statut }")

            # 3. Nom filter
            if "nom" in filters:
                nom_val = filters["nom"]
                filter_clauses.append(
                    f'    FILTER(CONTAINS(LCASE(STR(?nom)), "{nom_val.lower()}") || CONTAINS(LCASE(STR(?etudiant)), "{nom_val.lower()}"))'
                )
                expl_filters.append(f"nom contenant '{nom_val}'")

            # 4. Target establishment
            if "target_establishment" in filters:
                etab_val = filters["target_establishment"]
                filter_clauses.append(
                    f'    ?etudiant edu:appartientA ?etablissement .\n    FILTER(CONTAINS(LCASE(STR(?etablissement)), "{etab_val.lower()}"))'
                )
                expl_filters.append(f"établissement '{etab_val}'")

            clauses_str = "\n".join(filter_clauses)
            query = f"""{PREFIXES}
SELECT DISTINCT ?etudiant ?nom ?email ?specialite ?statut ?identifiant WHERE {{
    ?etudiant a edu:Etudiant .
    OPTIONAL {{ ?etudiant edu:nom ?nom }}
    OPTIONAL {{ ?etudiant edu:email ?email }}
{clauses_str}
    OPTIONAL {{ ?etudiant edu:identifiant ?identifiant }}
}}"""
            if expl_filters:
                explanation = f"Liste des étudiants filtrée par: {', '.join(expl_filters)}."
            else:
                explanation = "Liste de tous les individus enregistrés comme instances de la classe 'Etudiant'."
            return query, explanation

        elif intent == "LIST_TEACHERS":
            filter_clauses = []
            expl_filters = []

            # 1. Grade filter
            if "grade" in filters:
                grade_val = filters["grade"]
                filter_clauses.append(
                    f'    ?enseignant edu:grade ?grade .\n    FILTER(CONTAINS(LCASE(STR(?grade)), "{grade_val.lower()}"))'
                )
                expl_filters.append(f"grade '{grade_val}'")
            else:
                filter_clauses.append("    OPTIONAL { ?enseignant edu:grade ?grade }")

            # 2. Specialite filter
            if "specialite" in filters:
                spec_val = filters["specialite"]
                filter_clauses.append(
                    f'    ?enseignant edu:specialite ?specialite .\n    FILTER(CONTAINS(LCASE(STR(?specialite)), "{spec_val.lower()}"))'
                )
                expl_filters.append(f"spécialité contenant '{spec_val}'")
            else:
                filter_clauses.append("    OPTIONAL { ?enseignant edu:specialite ?specialite }")

            # 3. Nom filter
            if "nom" in filters:
                nom_val = filters["nom"]
                filter_clauses.append(
                    f'    FILTER(CONTAINS(LCASE(STR(?nom)), "{nom_val.lower()}") || CONTAINS(LCASE(STR(?enseignant)), "{nom_val.lower()}"))'
                )
                expl_filters.append(f"nom contenant '{nom_val}'")

            clauses_str = "\n".join(filter_clauses)
            query = f"""{PREFIXES}
SELECT DISTINCT ?enseignant ?nom ?grade ?email ?specialite ?identifiant WHERE {{
    ?enseignant a edu:Enseignant .
    OPTIONAL {{ ?enseignant edu:nom ?nom }}
    OPTIONAL {{ ?enseignant edu:email ?email }}
{clauses_str}
    OPTIONAL {{ ?enseignant edu:identifiant ?identifiant }}
}}"""
            if expl_filters:
                explanation = f"Liste des enseignants filtrée par: {', '.join(expl_filters)}."
            else:
                explanation = "Liste de tous les enseignants instances de la classe 'Enseignant'."
            return query, explanation

        elif intent == "LIST_ESTABLISHMENTS":
            filter_clauses = []
            expl_filters = []

            # 1. City / Ville filter
            if "ville" in filters:
                ville_val = filters["ville"]
                filter_clauses.append(
                    f'    ?etablissement edu:ville ?ville .\n    FILTER(CONTAINS(LCASE(STR(?ville)), "{ville_val.lower()}"))'
                )
                expl_filters.append(f"ville '{ville_val}'")
            else:
                filter_clauses.append("    OPTIONAL { ?etablissement edu:ville ?ville }")

            # 2. Statut filter
            if "statut" in filters:
                stat_val = filters["statut"]
                filter_clauses.append(
                    f'    ?etablissement edu:statut ?statut .\n    FILTER(CONTAINS(LCASE(STR(?statut)), "{stat_val.lower()}"))'
                )
                expl_filters.append(f"statut '{stat_val}'")
            else:
                filter_clauses.append("    OPTIONAL { ?etablissement edu:statut ?statut }")

            # 3. Nom filter
            if "nom" in filters:
                nom_val = filters["nom"]
                filter_clauses.append(
                    f'    FILTER(CONTAINS(LCASE(STR(?nom)), "{nom_val.lower()}") || CONTAINS(LCASE(STR(?etablissement)), "{nom_val.lower()}"))'
                )
                expl_filters.append(f"nom '{nom_val}'")

            clauses_str = "\n".join(filter_clauses)
            query = f"""{PREFIXES}
SELECT DISTINCT ?etablissement ?nom ?ville ?adresse ?siteWeb ?statut WHERE {{
    ?etablissement a ?type .
    FILTER(?type IN (edu:Université_Privée, edu:Établissement, edu:Université))
    OPTIONAL {{ ?etablissement edu:nom ?nom }}
{clauses_str}
    OPTIONAL {{ ?etablissement edu:adresse ?adresse }}
    OPTIONAL {{ ?etablissement edu:siteWeb ?siteWeb }}
}}"""
            if expl_filters:
                explanation = f"Recherche d'établissements filtrée par: {', '.join(expl_filters)}."
            else:
                explanation = "Recherche de tous les établissements universitaires et centres de formation."
            return query, explanation

        elif intent == "LIST_COURSES":
            filter_clauses = []
            expl_filters = []

            # 1. Credits filter
            if "credits" in filters:
                op, val = filters["credits"]
                filter_clauses.append(
                    f"    ?cours edu:credits ?credits .\n    FILTER(?credits {op} {val})"
                )
                expl_filters.append(f"crédits {op} {val}")
            else:
                filter_clauses.append("    OPTIONAL { ?cours edu:credits ?credits }")

            # 2. Duration filter
            if "duree" in filters:
                op, val = filters["duree"]
                filter_clauses.append(
                    f"    ?cours edu:duree ?duree .\n    FILTER(?duree {op} {val})"
                )
                expl_filters.append(f"durée {op} {val}h")
            else:
                filter_clauses.append("    OPTIONAL { ?cours edu:duree ?duree }")

            # 3. Target course or subject filter
            if "target_course" in filters:
                target_c = filters["target_course"]
                filter_clauses.append(
                    f'    FILTER(CONTAINS(LCASE(STR(?cours)), "{target_c.lower()}") || CONTAINS(LCASE(STR(?nom)), "{target_c.lower()}"))'
                )
                expl_filters.append(f"cours '{target_c}'")

            clauses_str = "\n".join(filter_clauses)
            query = f"""{PREFIXES}
SELECT DISTINCT ?cours ?nom ?codeCours ?credits ?duree ?uniteDuree ?semestre WHERE {{
    ?cours a ?type .
    FILTER(?type IN (edu:Cours, edu:Cours_Pratique, edu:Formation, edu:Programme_Licence))
    OPTIONAL {{ ?cours edu:nom ?nom }}
    OPTIONAL {{ ?cours edu:codeCours ?codeCours }}
{clauses_str}
    OPTIONAL {{ ?cours edu:uniteDuree ?uniteDuree }}
    OPTIONAL {{ ?cours edu:semestre ?semestre }}
}}"""
            if expl_filters:
                explanation = f"Liste des cours filtrée par: {', '.join(expl_filters)}."
            else:
                explanation = "Récupération de la liste des cours et programmes académiques disponibles."
            return query, explanation

        else:
            # General keyword search fallback
            clean_term = "".join(ch for ch in question if ch.isalnum() or ch.isspace()).strip()
            stopwords = {"quels", "sont", "les", "des", "qui", "pour", "avec", "dans", "what", "which", "show", "list"}
            words = [w for w in clean_term.split() if len(w) > 3 and w.lower() not in stopwords]
            search_word = words[0] if words else "java"
            query = f"""{PREFIXES}
SELECT DISTINCT ?sujet ?propriete ?valeur WHERE {{
    ?sujet ?propriete ?valeur .
    FILTER(isLiteral(?valeur) && CONTAINS(LCASE(STR(?valeur)), "{search_word.lower()}"))
}} LIMIT 25"""
            explanation = f"Recherche sémantique générale basée sur le mot-clé '{search_word}'."
            return query, explanation


sparql_builder = SparqlBuilder()
