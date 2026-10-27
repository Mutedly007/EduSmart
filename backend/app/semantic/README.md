# EduSmart Semantic Web Module (`app/semantic`)

## Overview

This module is reserved for the Semantic Web and Knowledge Graph engineering layer of EduSmart. It serves as the bridge between the FastAPI backend, the RDF/OWL domain ontology (validated in Protégé/HermiT), and the Apache Jena Fuseki SPARQL server.

## Planned Architectural Responsibilities

1. **RDFLib Graph Management (`graph.py`)**:
   - In-memory graph parsing and serialization (Turtle, RDF/XML, N-Triples, JSON-LD).
   - Local validation of ontological consistency and namespace bindings (`edu:`, `rdfs:`, `owl:`, `xsd:`).
   - Graph manipulation and export pipelines.

2. **Fuseki SPARQL Client (`fuseki_client.py`)**:
   - Asynchronous HTTP client (via `httpx`) interacting with Fuseki's SPARQL 1.1 Query (`/query`) and Update (`/update`) protocols.
   - Translation of SPARQL SELECT/CONSTRUCT results into standardized JSON for consumption by the React frontend.
   - Connection pooling, timeout handling, and query error sanitization.

3. **Knowledge Graph Exploration Services (`graph_service.py`)**:
   - Extraction of subgraphs for visualization in the frontend Knowledge Graph explorer.
   - Generation of node/link JSON structures representing Education entities (e.g., `Course`, `Competency`, `Prerequisite`, `Certification`).

## Guidelines & Constraints

- **No Premature Ontology Creation**: In Phase 1, no ontology classes, individuals, properties, or RDF triples are generated here.
- **Protégé Alignment**: All ontology modeling and reasoner checks (HermiT) are performed externally in Protégé. The exported ontology file (e.g. `edusmart.owl`) will be placed into the workspace and loaded here in Phase 2.
- **Pure JSON Delivery**: All semantic endpoints exposed to the frontend will exchange structured JSON responses adhering to the W3C SPARQL 1.1 Query Results JSON Format.
