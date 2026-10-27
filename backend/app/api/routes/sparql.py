"""SPARQL query execution and graph statistics API endpoints."""

from fastapi import APIRouter, HTTPException, status
from app.schemas.sparql import GraphStatsResponse, SparqlQueryRequest, SparqlQueryResponse
from app.services.sparql_service import sparql_service

router = APIRouter(prefix="/sparql", tags=["SPARQL Engine"])


@router.post(
    "/query",
    response_model=SparqlQueryResponse,
    summary="Execute arbitrary SPARQL 1.1 query",
    description="Executes a SPARQL query against Apache Jena Fuseki with fallback to RDFLib.",
)
async def execute_sparql(request: SparqlQueryRequest) -> SparqlQueryResponse:
    """Execute SPARQL query and return results formatted for JSON consumers."""
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SPARQL query cannot be empty.",
        )

    res = await sparql_service.execute_query(request.query)
    return SparqlQueryResponse(
        success=res["success"],
        query=res["query"],
        source=res["source"],
        results=res.get("results"),
        records=res.get("records"),
        total_records=res.get("total_records", 0),
        execution_time_ms=res["execution_time_ms"],
        error=res.get("error"),
    )


@router.post(
    "/update",
    summary="Execute arbitrary SPARQL 1.1 update",
    description="Executes a SPARQL 1.1 Update (INSERT/DELETE) against Apache Jena Fuseki with fallback to RDFLib.",
)
async def execute_sparql_update(request: SparqlQueryRequest) -> dict:
    """Execute SPARQL update query and return operation status."""
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SPARQL update query cannot be empty.",
        )

    res = await sparql_service.execute_update(request.query)
    if not res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res.get("error") or res.get("message"),
        )
    return res


@router.get(
    "/stats",
    response_model=GraphStatsResponse,
    summary="Get knowledge graph statistics",
    description="Returns triple counts, class counts, individual counts, and connection status.",
)
async def get_graph_stats() -> GraphStatsResponse:
    """Return overview metrics for the active knowledge graph."""
    stats = await sparql_service.get_graph_stats()
    return GraphStatsResponse(**stats)


@router.get(
    "/ping",
    summary="Check Apache Jena Fuseki connectivity",
    description="Pings the Fuseki SPARQL endpoint and returns live status and triple count.",
)
async def ping_fuseki() -> dict:
    """Ping Fuseki endpoint and return status."""
    is_online, message, count = await sparql_service.check_connection()
    return {
        "online": is_online,
        "message": message,
        "triples_count": count,
        "endpoint": sparql_service.endpoint,
    }
