"""Pydantic schemas for SPARQL queries and dataset statistics."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SparqlQueryRequest(BaseModel):
    """Request model for executing a SPARQL query."""

    query: str = Field(
        ...,
        description="The SPARQL 1.1 query string to execute.",
        examples=[
            "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10",
            "PREFIX owl: <http://www.w3.org/2002/07/owl#>\nSELECT ?ind WHERE { ?ind a owl:NamedIndividual }",
        ],
    )


class SparqlBindingValue(BaseModel):
    """Represents a single RDF term in a SPARQL result binding."""

    type: str = Field(..., description="Term type: 'uri', 'literal', or 'bnode'.")
    value: str = Field(..., description="The string or URI value.")
    datatype: Optional[str] = Field(None, description="Datatype URI if literal.")
    xml_lang: Optional[str] = Field(None, alias="xml:lang", description="Language tag if literal.")


class SparqlQueryResult(BaseModel):
    """Standard SPARQL 1.1 JSON result structure."""

    head: Dict[str, List[str]] = Field(default_factory=dict, description="Variables selected.")
    results: Optional[Dict[str, List[Dict[str, Any]]]] = Field(
        None, description="Bindings returned for SELECT queries."
    )
    boolean: Optional[bool] = Field(None, description="Boolean result for ASK queries.")


class SparqlQueryResponse(BaseModel):
    """API response model for SPARQL query executions."""

    success: bool = Field(..., description="Whether the query executed successfully.")
    query: str = Field(..., description="The query that was executed.")
    source: str = Field(..., description="Execution engine ('fuseki' or 'rdflib_fallback').")
    results: Optional[Dict[str, Any]] = Field(None, description="Raw SPARQL JSON result.")
    records: Optional[List[Dict[str, Any]]] = Field(
        None, description="Flattened key-value records for easy frontend table rendering."
    )
    total_records: int = Field(0, description="Number of result rows returned.")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds.")
    error: Optional[str] = Field(None, description="Error message if execution failed.")


class GraphStatsResponse(BaseModel):
    """Statistics overview of the semantic graph in Fuseki / RDFLib."""

    dataset: str = Field(..., description="Dataset name.")
    engine: str = Field(..., description="Active engine ('Apache Jena Fuseki' or 'RDFLib').")
    status: str = Field(..., description="Connection status ('online' or 'fallback').")
    triples_count: int = Field(..., description="Total RDF triples count.")
    classes_count: int = Field(..., description="Total OWL/RDFS classes declared.")
    individuals_count: int = Field(..., description="Total named individuals.")
    object_properties_count: int = Field(..., description="Total object properties.")
    datatype_properties_count: int = Field(..., description="Total datatype properties.")
    endpoint_url: str = Field(..., description="Active SPARQL query endpoint URL.")
