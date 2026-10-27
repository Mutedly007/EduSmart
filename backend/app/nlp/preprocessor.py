"""Linguistic preprocessor for the EduSmart TALN subsystem.

Cleans input text, detects question language (French / English),
and tokenizes using spaCy language models.
"""

import logging
import re
from typing import Any, Optional, Tuple
import spacy
from spacy.language import Language

logger = logging.getLogger("edusmart.nlp.preprocessor")


class TextPreprocessor:
    """Handles question normalization, language detection, and spaCy doc processing."""

    def __init__(self) -> None:
        self._fr_nlp: Optional[Language] = None
        self._en_nlp: Optional[Language] = None

    def _get_fr_model(self) -> Language:
        """Lazy-load the French spaCy model."""
        if self._fr_nlp is None:
            try:
                self._fr_nlp = spacy.load("fr_core_news_sm")
                logger.info("Loaded French spaCy model: fr_core_news_sm")
            except Exception as e:
                logger.warning("Could not load fr_core_news_sm, falling back to blank('fr'): %s", e)
                self._fr_nlp = spacy.blank("fr")
        return self._fr_nlp

    def _get_en_model(self) -> Language:
        """Lazy-load the English spaCy model."""
        if self._en_nlp is None:
            try:
                self._en_nlp = spacy.load("en_core_web_sm")
                logger.info("Loaded English spaCy model: en_core_web_sm")
            except Exception as e:
                logger.warning("Could not load en_core_web_sm, falling back to blank('en'): %s", e)
                self._en_nlp = spacy.blank("en")
        return self._en_nlp

    def detect_language(self, text: str) -> str:
        """Detect whether the query is French or English using vocabulary heuristics."""
        lower = text.lower()
        # French question markers and stop words
        fr_markers = [
            "qui", "quel", "quels", "quelle", "quelles", "quoi", "où", "comment", "combien",
            "est-ce", "sont", "donne", "liste", "cours", "enseignant", "étudiant", "etudiant",
            "formation", "établissement", "etablissement", "proposé", "propose", "enseigne",
            "par", "pour", "avec", "dans", "les", "des", "une", "un"
        ]
        # English question markers
        en_markers = [
            "who", "what", "which", "where", "how", "give", "list", "show", "courses",
            "teacher", "student", "university", "school", "taught", "by", "for", "with",
            "does", "is", "are", "the"
        ]

        words = set(re.findall(r"\w+", lower))
        fr_score = len(words.intersection(fr_markers))
        en_score = len(words.intersection(en_markers))

        return "en" if en_score > fr_score else "fr"

    def clean_text(self, text: str) -> str:
        """Normalize whitespaces and remove non-standard punctuation."""
        # Replace multiple spaces with single space
        cleaned = re.sub(r"\s+", " ", text.strip())
        return cleaned

    def process(self, text: str) -> Tuple[Any, str]:
        """Preprocess text, detect language, and return (spaCy Doc, lang)."""
        cleaned = self.clean_text(text)
        lang = self.detect_language(cleaned)
        nlp = self._get_fr_model() if lang == "fr" else self._get_en_model()
        doc = nlp(cleaned)
        return doc, lang


preprocessor = TextPreprocessor()
