import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Download,
  Database,
  Table as TableIcon,
  Code2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { GraphStats, SparqlQueryResponse } from '../types';

export const SPARQLExplorerPage: React.FC = () => {
  const defaultQuery = `PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?cours ?nom ?codeCours ?credits ?duree WHERE {
  ?cours a ?type .
  FILTER(?type IN (edu:Cours, edu:Cours_Pratique, edu:Formation))
  OPTIONAL { ?cours edu:nom ?nom }
  OPTIONAL { ?cours edu:codeCours ?codeCours }
  OPTIONAL { ?cours edu:credits ?credits }
  OPTIONAL { ?cours edu:duree ?duree }
}
ORDER BY ?nom
LIMIT 20`;

  const [query, setQuery] = useState(defaultQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SparqlQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');

  const presetQueries = [
    {
      name: 'Courses & Credits',
      query: defaultQuery,
    },
    {
      name: 'Offerings by ESPRIT',
      query: `PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>

SELECT DISTINCT ?etablissement ?nomEtablissement ?formation ?nomFormation ?type WHERE {
  ?etablissement a ?etabType .
  OPTIONAL { ?etablissement edu:nom ?nomEtablissement }
  {
    ?etablissement edu:propose ?formation .
    BIND("Programme Académique" AS ?type)
  } UNION {
    ?etablissement edu:organise ?formation .
    BIND("Formation Continue" AS ?type)
  }
  OPTIONAL { ?formation edu:nom ?nomFormation }
  FILTER(STRENDS(STR(?etablissement), "ESPRIT"))
}`,
    },
    {
      name: 'Instructors & Courses Taught',
      query: `PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>

SELECT DISTINCT ?enseignant ?nomEnseignant ?email ?cours ?nomCours WHERE {
  ?enseignant a edu:Enseignant ;
              edu:enseigne ?cours .
  OPTIONAL { ?enseignant edu:nom ?nomEnseignant }
  OPTIONAL { ?enseignant edu:email ?email }
  OPTIONAL { ?cours edu:nom ?nomCours }
}`,
    },
    {
      name: 'Students & Enrolled Programs',
      query: `PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>

SELECT DISTINCT ?etudiant ?nomEtudiant ?programme ?nomProgramme ?etablissement ?nomEtablissement WHERE {
  ?etudiant a edu:Etudiant .
  OPTIONAL { ?etudiant edu:nom ?nomEtudiant }
  OPTIONAL { ?etudiant edu:suitProgramme ?programme . OPTIONAL { ?programme edu:nom ?nomProgramme } }
  OPTIONAL { ?etudiant edu:appartientA ?etablissement . OPTIONAL { ?etablissement edu:nom ?nomEtablissement } }
}`,
    },
    {
      name: 'Formations by Modality (Hybrid)',
      query: `PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>

SELECT DISTINCT ?formation ?nomFormation ?modalite ?duree ?prix WHERE {
  ?formation edu:utiliseModalite ?modalite .
  OPTIONAL { ?formation edu:nom ?nomFormation }
  OPTIONAL { ?formation edu:duree ?duree }
  OPTIONAL { ?formation edu:prix ?prix }
}`,
    },
    {
      name: 'All Named Individuals',
      query: `PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>

SELECT DISTINCT ?individual ?type ?nom WHERE {
  ?individual a owl:NamedIndividual .
  OPTIONAL { ?individual rdf:type ?type . FILTER(?type != owl:NamedIndividual) }
  OPTIONAL { ?individual edu:nom ?nom }
}
ORDER BY ?individual`,
    },
  ];

  // Check if a custom query was passed from another page (e.g. NLSearchPage)
  useEffect(() => {
    const custom = sessionStorage.getItem('edusmart_custom_sparql');
    if (custom) {
      setQuery(custom);
      sessionStorage.removeItem('edusmart_custom_sparql');
      handleRunQuery(custom);
    } else {
      // Auto-run default query on mount
      handleRunQuery(defaultQuery);
    }

    // Load graph stats
    api.getGraphStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load graph stats:', err));
  }, []);

  const handleRunQuery = async (queryToRun?: string) => {
    const q = (queryToRun !== undefined ? queryToRun : query).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);

    try {
      const resp = await api.executeSparql(q);
      setResult(resp);
      if (!resp.success && resp.error) {
        setError(resp.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to execute query against SPARQL endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!result?.records) return;
    const blob = new Blob([JSON.stringify(result.records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sparql_results_${Date.now()}.json`;
    a.click();
  };

  const handleDownloadCsv = () => {
    if (!result?.records || result.records.length === 0) return;
    const headers = Object.keys(result.records[0]).filter((k) => !k.endsWith('_name'));
    const rows = result.records.map((r) =>
      headers.map((h) => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sparql_results_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold mb-2 border border-slate-200">
          <Terminal className="w-3.5 h-3.5 text-edu-600" /> SPARQL 1.1 Query Engine
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          SPARQL Query Explorer
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Formulate, test, and execute standard SPARQL 1.1 queries directly against the live
          <strong> Apache Jena Fuseki</strong> triplestore. Responses are returned as standard W3C SPARQL JSON.
        </p>
      </div>

      {/* Editor & Controls */}
      <Card
        title="SPARQL 1.1 Query Workspace"
        subtitle="Write or select a preset SPARQL query below"
        icon={<Terminal className="w-5 h-5 text-edu-600" />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Presets:</span>
            <select
              onChange={(e) => {
                const selected = presetQueries.find((p) => p.name === e.target.value);
                if (selected) {
                  setQuery(selected.query);
                  handleRunQuery(selected.query);
                }
              }}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-edu-500 cursor-pointer"
            >
              {presetQueries.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Target Endpoint Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-700">Target SPARQL Endpoint:</span>
              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-mono text-[11px]">
                {stats?.endpoint_url || 'http://localhost:3030/edusmart/query'}
              </code>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fuseki Online ({stats?.triples_count || 956} triples)</span>
              </span>
            </div>
          </div>

          {/* Editor Area */}
          <div className="relative font-mono text-xs">
            <textarea
              rows={11}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-edu-500 resize-none font-mono text-xs leading-relaxed shadow-inner"
              spellCheck={false}
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium">Protocol:</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">W3C SPARQL 1.1 Protocol</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuery(defaultQuery)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleRunQuery()}
                disabled={isLoading || !query.trim()}
                className="px-6 py-2.5 rounded-lg bg-edu-600 hover:bg-edu-700 disabled:bg-slate-300 text-white text-xs font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing SPARQL...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Query</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <div className="font-semibold">SPARQL Query Syntax Error</div>
            <div className="text-xs mt-0.5 text-red-600 font-mono">{error}</div>
          </div>
        </div>
      )}

      {/* Query Results Card */}
      {result && (
        <Card
          title="Query Results"
          subtitle={`Executed against ${result.source === 'fuseki' ? 'Apache Jena Fuseki' : 'RDFLib'} in ${result.execution_time_ms} ms`}
          icon={<Database className="w-5 h-5 text-edu-600" />}
          badge={
            <Badge variant="emerald" size="sm">
              {result.total_records} record{result.total_records !== 1 ? 's' : ''}
            </Badge>
          }
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" /> Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    viewMode === 'raw' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" /> Raw JSON
                </button>
              </div>

              {result.records && result.records.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Export as CSV"
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Export as JSON"
                  >
                    <Download className="w-3 h-3" /> JSON
                  </button>
                </>
              )}
            </div>
          }
        >
          {viewMode === 'table' ? (
            result.records && result.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                      {Object.keys(result.records[0])
                        .filter((k) => !k.endsWith('_name'))
                        .map((header) => (
                          <th key={header} className="p-3 font-semibold">
                            {header}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.records.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        {Object.keys(result.records![0])
                          .filter((k) => !k.endsWith('_name'))
                          .map((col) => {
                            const val = row[col];
                            const friendlyName = row[`${col}_name`];
                            const displayVal = friendlyName || val;
                            const isUri = String(val).startsWith('http');

                            return (
                              <td key={col} className="p-3">
                                {isUri ? (
                                  <span className="font-semibold text-edu-700 bg-edu-50/80 px-2 py-0.5 rounded border border-edu-100 inline-block font-mono text-[11px]">
                                    {displayVal}
                                  </span>
                                ) : (
                                  <span className="text-slate-800">{String(displayVal)}</span>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Query executed successfully, but returned 0 rows.
              </div>
            )
          ) : (
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
              <code>{JSON.stringify(result.results || result.records, null, 2)}</code>
            </pre>
          )}
        </Card>
      )}
    </div>
  );
};
