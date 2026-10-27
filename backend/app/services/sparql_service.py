"""SPARQL Service for communicating with Apache Jena Fuseki with RDFLib fallback.

Handles query execution, dataset health checks, graph statistics,
and semantic entity lookups for the EduSmart platform.
"""

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx
import rdflib

from app.core.config import settings

logger = logging.getLogger("edusmart.sparql")


class SparqlService:
    """Service to execute SPARQL queries against Apache Jena Fuseki with RDFLib fallback."""

    def __init__(self) -> None:
        self.endpoint: str = settings.FUSEKI_QUERY_ENDPOINT
        self.dataset: str = settings.FUSEKI_DATASET
        self.base_url: str = settings.FUSEKI_BASE_URL
        self._rdflib_graph: Optional[rdflib.Graph] = None

    def _get_local_graph(self) -> rdflib.Graph:
        """Lazy-load the local ontology into RDFLib for offline fallback."""
        if self._rdflib_graph is None:
            g = rdflib.Graph()
            backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            path = (
                settings.ONTOLOGY_FILE_PATH
                if os.path.isabs(settings.ONTOLOGY_FILE_PATH)
                else os.path.join(backend_root, settings.ONTOLOGY_FILE_PATH)
            )
            if os.path.exists(path):
                logger.info("Loading fallback RDFLib graph from %s", path)
                g.parse(path, format="xml")
            self._rdflib_graph = g
        return self._rdflib_graph

    async def check_connection(self) -> Tuple[bool, str, int]:
        """Check whether Apache Jena Fuseki is reachable and return triple count.

        Returns:
            Tuple of (is_online, status_message, triple_count).
        """
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                query = "SELECT (COUNT(*) AS ?count) WHERE { ?s ?p ?o }"
                resp = await client.post(
                    self.endpoint,
                    data={"query": query},
                    headers={"Accept": "application/sparql-results+json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    count = int(data["results"]["bindings"][0]["count"]["value"])
                    return True, f"Connected to Fuseki dataset '{self.dataset}'", count
                return False, f"Fuseki returned HTTP status {resp.status_code}", 0
        except Exception as e:
            logger.debug("Fuseki health check failed: %s", e)
            return False, f"Fuseki unreachable: {str(e)}", 0

    async def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute a SPARQL query against Fuseki, falling back to RDFLib if unreachable.

        Args:
            query: The SPARQL query string.

        Returns:
            Dict containing success, source, results, flattened records, and timing.
        """
        t0 = time.perf_counter()

        # 1. Try Apache Jena Fuseki first
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    self.endpoint,
                    data={"query": query},
                    headers={"Accept": "application/sparql-results+json"},
                )
                if resp.status_code == 200:
                    raw_data = resp.json()
                    exec_time = (time.perf_counter() - t0) * 1000.0
                    records = self._flatten_results(raw_data)
                    return {
                        "success": True,
                        "query": query,
                        "source": "fuseki",
                        "results": raw_data,
                        "records": records,
                        "total_records": len(records),
                        "execution_time_ms": round(exec_time, 2),
                        "error": None,
                    }
                else:
                    logger.warning("Fuseki query returned status %d: %s", resp.status_code, resp.text)
        except Exception as fuseki_err:
            logger.warning("Fuseki unreachable, failing over to local RDFLib graph: %s", fuseki_err)

        # 2. Fallback to in-memory RDFLib graph
        try:
            g = self._get_local_graph()
            qres = g.query(query)
            exec_time = (time.perf_counter() - t0) * 1000.0

            raw_data = json.loads(qres.serialize(format="json").decode("utf-8"))
            records = self._flatten_results(raw_data)
            return {
                "success": True,
                "query": query,
                "source": "rdflib_fallback",
                "results": raw_data,
                "records": records,
                "total_records": len(records),
                "execution_time_ms": round(exec_time, 2),
                "error": None,
            }
        except Exception as rdflib_err:
            exec_time = (time.perf_counter() - t0) * 1000.0
            logger.error("SPARQL query failed on both Fuseki and RDFLib: %s", rdflib_err)
            return {
                "success": False,
                "query": query,
                "source": "failed",
                "results": None,
                "records": [],
                "total_records": 0,
                "execution_time_ms": round(exec_time, 2),
                "error": str(rdflib_err),
            }

    async def execute_update(self, update_query: str) -> Dict[str, Any]:
        """Execute a SPARQL 1.1 Update query against Apache Jena Fuseki with RDFLib fallback.

        Args:
            update_query: The SPARQL UPDATE string (INSERT DATA, DELETE DATA, DELETE/INSERT).

        Returns:
            Dict containing success, message, source, execution_time_ms, and error.
        """
        t0 = time.perf_counter()
        update_endpoint = settings.FUSEKI_UPDATE_ENDPOINT

        # 1. Try Fuseki update endpoint
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    update_endpoint,
                    data={"update": update_query},
                    headers={"Accept": "application/json, text/plain, */*"},
                )
                if resp.status_code in (200, 204):
                    exec_time = (time.perf_counter() - t0) * 1000.0
                    # Keep local graph in sync if initialized
                    if self._rdflib_graph is not None:
                        try:
                            self._rdflib_graph.update(update_query)
                        except Exception:
                            pass
                    return {
                        "success": True,
                        "message": "Requête SPARQL Update exécutée avec succès dans Fuseki.",
                        "source": "fuseki",
                        "execution_time_ms": round(exec_time, 2),
                        "error": None,
                    }
                logger.warning("Fuseki update returned status %s: %s", resp.status_code, resp.text)
        except Exception as e:
            logger.warning("Failed to execute update on Fuseki: %s", e)

        # 2. Fallback to local RDFLib in-memory graph
        try:
            g = self._get_local_graph()
            g.update(update_query)
            exec_time = (time.perf_counter() - t0) * 1000.0
            return {
                "success": True,
                "message": "Requête SPARQL Update exécutée sur le graphe RDFLib local (fallback).",
                "source": "rdflib_fallback",
                "execution_time_ms": round(exec_time, 2),
                "error": None,
            }
        except Exception as e:
            exec_time = (time.perf_counter() - t0) * 1000.0
            return {
                "success": False,
                "message": f"Échec de la mise à jour SPARQL: {str(e)}",
                "source": "failed",
                "execution_time_ms": round(exec_time, 2),
                "error": str(e),
            }

    def _flatten_results(self, raw_sparql_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Flatten standard SPARQL JSON results bindings into plain dictionary records."""
        records = []
        if not raw_sparql_json or "results" not in raw_sparql_json:
            return records

        bindings = raw_sparql_json.get("results", {}).get("bindings", [])
        for row in bindings:
            rec = {}
            for var_name, term in row.items():
                val = term.get("value", "")
                # If it's a URI, also provide a clean local name
                if term.get("type") == "uri" and "#" in val:
                    rec[f"{var_name}_name"] = val.split("#")[-1]
                rec[var_name] = val
            records.append(rec)
        return records

    async def get_graph_stats(self) -> Dict[str, Any]:
        """Fetch summary statistics about the ontology graph."""
        is_online, status_msg, triple_count = await self.check_connection()

        # Class count query
        class_query = """
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        SELECT (COUNT(DISTINCT ?c) AS ?count) WHERE { ?c a owl:Class }
        """
        # Individual count query
        indiv_query = """
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        SELECT (COUNT(DISTINCT ?i) AS ?count) WHERE { ?i a owl:NamedIndividual }
        """
        # Object property query
        op_query = """
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        SELECT (COUNT(DISTINCT ?p) AS ?count) WHERE { ?p a owl:ObjectProperty }
        """
        # Data property query
        dp_query = """
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        SELECT (COUNT(DISTINCT ?p) AS ?count) WHERE { ?p a owl:DatatypeProperty }
        """

        class_res = await self.execute_query(class_query)
        indiv_res = await self.execute_query(indiv_query)
        op_res = await self.execute_query(op_query)
        dp_res = await self.execute_query(dp_query)

        def extract_count(res: Dict[str, Any]) -> int:
            try:
                bindings = res.get("results", {}).get("results", {}).get("bindings", [])
                if bindings:
                    return int(bindings[0].get("count", {}).get("value", 0))
            except Exception:
                pass
            return 0

        # If Fuseki is online, use triple_count, else query RDFLib for triple count
        if not is_online:
            count_res = await self.execute_query("SELECT (COUNT(*) AS ?count) WHERE { ?s ?p ?o }")
            triple_count = extract_count(count_res)

        return {
            "dataset": self.dataset,
            "engine": "Apache Jena Fuseki" if is_online else "RDFLib (In-Memory)",
            "status": "online" if is_online else "fallback",
            "triples_count": triple_count,
            "classes_count": extract_count(class_res),
            "individuals_count": extract_count(indiv_res),
            "object_properties_count": extract_count(op_res),
            "datatype_properties_count": extract_count(dp_res),
            "endpoint_url": self.endpoint if is_online else "local://rdflib",
        }

    async def get_classes(self) -> Dict[str, Any]:
        """Fetch list of all OWL classes and their direct parent classes."""
        query = """
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?class ?label ?parent WHERE {
            ?class a owl:Class .
            OPTIONAL { ?class rdfs:label ?label }
            OPTIONAL { ?class rdfs:subClassOf ?parent . FILTER(isURI(?parent)) }
        }
        ORDER BY ?class
        """
        res = await self.execute_query(query)
        raw_classes = res.get("records", [])

        classes_list = []
        for c in raw_classes:
            uri = c.get("class", "")
            if not uri or uri.startswith("http://www.w3.org/2002/07/owl#"):
                continue
            name = uri.split("#")[-1] if "#" in uri else uri.split("/")[-1]
            parent_uri = c.get("parent")
            parent_name = None
            if parent_uri and "#" in parent_uri:
                parent_name = parent_uri.split("#")[-1]

            classes_list.append(
                {
                    "uri": uri,
                    "name": name,
                    "label": c.get("label") or name.replace("_", " "),
                    "parent_uri": parent_uri,
                    "parent_name": parent_name,
                    "subclasses_count": 0,
                    "instances_count": 0,
                }
            )

        root_branches = ["Apprentissage", "Compétence", "Formation", "Personnes", "Établissement"]
        return {
            "total_classes": len(classes_list),
            "root_branches": root_branches,
            "classes": classes_list,
        }

    async def get_individuals(self, class_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch named individuals with their types and asserted properties."""
        filter_clause = ""
        if class_name:
            filter_clause = f"FILTER(STRENDS(STR(?type), '{class_name}'))"

        query = f"""
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?ind ?type ?prop ?val WHERE {{
            ?ind a owl:NamedIndividual .
            OPTIONAL {{ ?ind rdf:type ?type . FILTER(?type != owl:NamedIndividual) }}
            OPTIONAL {{ ?ind ?prop ?val . FILTER(?prop != rdf:type) }}
            {filter_clause}
        }}
        ORDER BY ?ind
        """
        res = await self.execute_query(query)
        records = res.get("records", [])

        # Group by individual URI
        individuals_map: Dict[str, Dict[str, Any]] = {}
        for r in records:
            uri = r.get("ind", "")
            if not uri:
                continue
            name = uri.split("#")[-1] if "#" in uri else uri.split("/")[-1]

            if uri not in individuals_map:
                individuals_map[uri] = {
                    "uri": uri,
                    "name": name,
                    "types": set(),
                    "properties": {},
                    "label": name.replace("_", " "),
                }

            t = r.get("type_name") or (r.get("type", "").split("#")[-1] if r.get("type") else None)
            if t:
                individuals_map[uri]["types"].add(t)

            prop_uri = r.get("prop")
            val = r.get("val")
            if prop_uri and val:
                prop_name = prop_uri.split("#")[-1] if "#" in prop_uri else prop_uri.split("/")[-1]
                val_display = val.split("#")[-1] if "#" in str(val) else str(val)
                individuals_map[uri]["properties"][prop_name] = val_display

        result = []
        for item in individuals_map.values():
            result.append(
                {
                    "uri": item["uri"],
                    "name": item["name"],
                    "types": sorted(list(item["types"])),
                    "label": item["label"],
                    "properties": item["properties"],
                }
            )
        return result

    async def get_individual_detail(self, name_or_uri: str) -> Optional[Dict[str, Any]]:
        """Fetch comprehensive attributes and outgoing/incoming relationships for an individual."""
        target = name_or_uri
        if not target.startswith("http"):
            target_uri_filter = f"STRENDS(STR(?ind), '#{name_or_uri}') || STRENDS(STR(?ind), '/{name_or_uri}')"
        else:
            target_uri_filter = f"?ind = <{name_or_uri}>"

        query = f"""
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?ind ?type ?p ?o ?incoming_s ?incoming_p WHERE {{
            ?ind a owl:NamedIndividual .
            FILTER({target_uri_filter})
            OPTIONAL {{ ?ind rdf:type ?type . FILTER(?type != owl:NamedIndividual) }}
            OPTIONAL {{ ?ind ?p ?o . FILTER(?p != rdf:type) }}
            OPTIONAL {{ ?incoming_s ?incoming_p ?ind }}
        }}
        """
        res = await self.execute_query(query)
        records = res.get("records", [])
        if not records:
            return None

        first = records[0]
        uri = first.get("ind", "")
        name = uri.split("#")[-1] if "#" in uri else uri.split("/")[-1]

        types = set()
        attributes = {}
        relationships = []
        incoming_relations = []

        seen_rel = set()
        seen_inc = set()

        for r in records:
            t = r.get("type_name")
            if t:
                types.add(t)

            p = r.get("p")
            o = r.get("o")
            if p and o:
                p_name = p.split("#")[-1] if "#" in p else p.split("/")[-1]
                # Is object another individual or a literal?
                if str(o).startswith("http"):
                    rel_key = (p, o)
                    if rel_key not in seen_rel:
                        seen_rel.add(rel_key)
                        relationships.append(
                            {
                                "property_uri": p,
                                "property_name": p_name,
                                "property_type": "object",
                                "value": o.split("#")[-1] if "#" in str(o) else str(o),
                                "label": p_name.replace("_", " "),
                            }
                        )
                else:
                    attributes[p_name] = str(o)

            inc_s = r.get("incoming_s")
            inc_p = r.get("incoming_p")
            if inc_s and inc_p:
                inc_key = (inc_s, inc_p)
                if inc_key not in seen_inc:
                    seen_inc.add(inc_key)
                    inc_p_name = inc_p.split("#")[-1] if "#" in inc_p else inc_p.split("/")[-1]
                    incoming_relations.append(
                        {
                            "property_uri": inc_p,
                            "property_name": inc_p_name,
                            "property_type": "object",
                            "value": inc_s.split("#")[-1] if "#" in str(inc_s) else str(inc_s),
                            "label": inc_p_name.replace("_", " "),
                        }
                    )

        return {
            "uri": uri,
            "name": name,
            "types": sorted(list(types)),
            "attributes": attributes,
            "relationships": relationships,
            "incoming_relations": incoming_relations,
        }


sparql_service = SparqlService()
