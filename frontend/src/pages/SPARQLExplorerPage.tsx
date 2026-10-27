import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Download,
  Database,
  Table as TableIcon,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const SPARQLExplorerPage: React.FC = () => {
  const [query, setQuery] = useState(`PREFIX edu: <http://edusmart.org/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT ?course ?label ?credits
WHERE {
  ?course a edu:Course ;
          rdfs:label ?label ;
          edu:hasCredits ?credits .
  FILTER(?credits >= 4)
}
ORDER BY DESC(?credits)
LIMIT 20`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold mb-2 border border-slate-200">
          <Terminal className="w-3.5 h-3.5" /> SPARQL 1.1 Query Engine
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          SPARQL Query Explorer
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Interactive query editor for directly formulating, testing, and debugging standard SPARQL 1.1 queries
          against the Apache Jena Fuseki triplestore. Responses are exchanged as standard W3C SPARQL JSON.
        </p>
      </div>

      {/* Editor & Controls */}
      <Card
        title="SPARQL 1.1 Query Workspace"
        subtitle="Write or modify your SPARQL query below"
        icon={<Terminal className="w-5 h-5 text-edu-600" />}
        badge={<Badge variant="navy" size="sm">Editor Preview</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              title="Query presets disabled until ontology is loaded"
              className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-md text-xs font-medium cursor-not-allowed border border-slate-200 select-none"
            >
              Presets (Phase 2)
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Target Endpoint Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-700">Target SPARQL Endpoint:</span>
              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">
                http://localhost:3030/edusmart/query
              </code>
            </div>
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-medium">Endpoint Standby (Not Connected)</span>
            </div>
          </div>

          {/* Editor Area */}
          <div className="relative font-mono text-xs">
            <textarea
              rows={12}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-4 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-edu-500 resize-none font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Output format:</span>
              <span className="px-2 py-1 bg-edu-50 text-edu-700 border border-edu-200 rounded text-xs font-medium">
                JSON (W3C Standard)
              </span>
              <span className="px-2 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded text-xs font-medium cursor-not-allowed">
                XML
              </span>
              <span className="px-2 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded text-xs font-medium cursor-not-allowed">
                CSV
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="button"
                disabled
                title="SPARQL execution requires active Fuseki dataset (Phase 3)"
                className="px-4 py-2 bg-slate-200 text-slate-400 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-not-allowed select-none"
              >
                <Play className="w-3.5 h-3.5" />
                Execute Query
                <Badge variant="gray" size="sm">Phase 3</Badge>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Empty Results Table Area */}
      <Card
        title="SPARQL Query Results Table"
        subtitle="Tabular visualization of SPARQL bindings"
        icon={<TableIcon className="w-5 h-5 text-edu-600" />}
        actions={
          <button
            type="button"
            disabled
            className="text-xs text-slate-400 flex items-center gap-1 cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        }
      >
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">?course (URI)</th>
                <th className="px-4 py-3">?label (Literal)</th>
                <th className="px-4 py-3">?credits (Integer)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-400">
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center">
                    <TableIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No Query Results Available</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                      Execute a SPARQL query against Apache Jena Fuseki once the Education ontology
                      dataset has been populated in Phase 3.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
