import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Terminal,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Clock,
  Database,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { NlpQueryResponse, SampleQuestion } from '../types';

export const NLSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [question, setQuestion] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NlpQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sampleQuestions, setSampleQuestions] = useState<SampleQuestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Load sample questions from backend
  useEffect(() => {
    api.getSampleQuestions()
      .then((data) => setSampleQuestions(data))
      .catch((err) => console.error('Failed to load sample questions:', err));
  }, []);

  // Auto-run if q param is present on mount
  useEffect(() => {
    if (initialQuery.trim()) {
      handleSearch(initialQuery);
    }
  }, []);

  const handleSearch = async (queryToRun?: string) => {
    const q = (queryToRun !== undefined ? queryToRun : question).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const resp = await api.askNlpQuestion(q, true);
      setResult(resp);
      if (!resp.success && resp.error) {
        setError(resp.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to communicate with TALN translation engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySparql = () => {
    if (!result?.sparql_query) return;
    navigator.clipboard.writeText(result.sparql_query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInSparqlExplorer = () => {
    if (!result?.sparql_query) return;
    sessionStorage.setItem('edusmart_custom_sparql', result.sparql_query);
    navigate('/sparql');
  };

  const categories = ['All', ...Array.from(new Set(sampleQuestions.map((s) => s.category)))];
  const filteredSamples = activeCategory === 'All'
    ? sampleQuestions
    : sampleQuestions.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-edu-700 rounded-full text-xs font-semibold mb-2 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" /> TALN Question Answering Engine
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Natural Language Question Interface
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Ask questions in plain French or English. The custom TALN module analyzes questions linguistically
          using <strong>spaCy</strong>, identifies educational entities, and deterministically generates executable
          <strong> SPARQL 1.1</strong> queries dispatched to Apache Jena Fuseki.
        </p>
      </div>

      {/* Question Input Card */}
      <Card
        title="Ask the Knowledge Graph"
        subtitle="Formulate natural questions regarding establishments, courses, teachers, or students"
        icon={<Search className="w-5 h-5 text-edu-600" />}
      >
        <div className="space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Ex: 'Quels sont les cours proposés par ESPRIT ?' ou 'Qui enseigne le cours de Java ?'..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-500 focus:bg-white resize-none transition-all shadow-inner"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Database className="w-3.5 h-3.5 text-emerald-600" /> Endpoint:
              </span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[11px]">
                Fuseki: /edusmart/query
              </code>
            </div>

            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={isLoading || !question.trim()}
              className="px-6 py-2.5 rounded-lg bg-edu-600 hover:bg-edu-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Translating & Querying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate & Execute</span>
                </>
              )}
            </button>
          </div>

          {/* Sample Questions Pills */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Curated Demo Queries:
              </span>
              {/* Category selector */}
              <div className="flex items-center gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                      activeCategory === cat
                        ? 'bg-edu-600 text-white font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredSamples.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(s.question);
                    handleSearch(s.question);
                  }}
                  className="text-xs bg-slate-50 hover:bg-edu-50 text-slate-700 hover:text-edu-700 border border-slate-200 hover:border-edu-200 px-3 py-1.5 rounded-lg transition-all text-left flex items-center gap-1.5 group cursor-pointer shadow-xs"
                >
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/60 group-hover:bg-edu-200/60 text-slate-700 group-hover:text-edu-800">
                    {s.language.toUpperCase()}
                  </span>
                  <span>{s.question}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-edu-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <div className="font-semibold">Query Execution Error</div>
            <div className="text-xs mt-0.5 text-red-600">{error}</div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Metadata Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Intent:</span>
              <Badge variant="blue" size="sm">{result.intent}</Badge>

              <span className="text-xs text-slate-500 font-medium ml-2">Language:</span>
              <Badge variant="navy" size="sm">{result.language === 'fr' ? 'Français' : 'English'}</Badge>

              <span className="text-xs text-slate-500 font-medium ml-2">Source:</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {result.execution_source === 'fuseki' ? 'Apache Jena Fuseki' : 'RDFLib Fallback'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {result.processing_time_ms} ms
              </span>
              <span className="font-semibold text-slate-700">
                {result.total_records} record{result.total_records !== 1 ? 's' : ''} returned
              </span>
            </div>
          </div>

          {/* Explanation & Entities */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="text-slate-700 font-medium leading-relaxed">
              <strong>TALN Interpretation:</strong> {result.explanation}
            </div>
            {result.entities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-slate-400 font-medium">Mapped Entities:</span>
                {result.entities.map((ent, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700 font-mono"
                  >
                    <span className="text-edu-600 font-semibold">{ent.entity_type}:</span> {ent.matched_name || ent.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Generated SPARQL 1.1 Query Block */}
          <Card
            title="Generated SPARQL 1.1 Query"
            subtitle="Deterministic template generated by rule-based grammar and mapped to EduSmart ontology"
            icon={<Terminal className="w-5 h-5 text-edu-600" />}
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySparql}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy SPARQL'}
                </button>
                <button
                  type="button"
                  onClick={handleOpenInSparqlExplorer}
                  className="px-2.5 py-1 bg-edu-50 hover:bg-edu-100 text-edu-700 border border-edu-200 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Open in Explorer
                </button>
              </div>
            }
          >
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
              <code>{result.sparql_query}</code>
            </pre>
          </Card>

          {/* Result Data Table */}
          <Card
            title="Semantic Query Results"
            subtitle={`Live results returned from Apache Jena Fuseki (${result.total_records} rows)`}
            icon={<Database className="w-5 h-5 text-edu-600" />}
          >
            {result.records && result.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                      {Object.keys(result.records[0])
                        .filter((k) => !k.endsWith('_name')) // hide raw URI duplicate if friendly name is present
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
                No matching records found in the knowledge graph for this query.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Architecture Highlights Card */}
      <Card
        title="TALN Pipeline Architecture"
        subtitle="Compliant with university specifications (spaCy + linguistic rules, strictly non-LLM)"
        icon={<Cpu className="w-5 h-5 text-edu-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">1</span>
              Linguistic Analysis
            </div>
            <p className="text-xs text-slate-500">
              spaCy tokenization, POS tagging, lemmatization with <code className="font-mono">fr_core_news_sm</code> and <code className="font-mono">en_core_web_sm</code>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold">2</span>
              Entity & Intent Mapping
            </div>
            <p className="text-xs text-slate-500">
              Deterministic recognition of domain individuals (<code className="font-mono">ESPRIT</code>, <code className="font-mono">Ali</code>, <code className="font-mono">ahmed</code>, <code className="font-mono">java</code>).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] font-bold">3</span>
              SPARQL 1.1 Synthesis
            </div>
            <p className="text-xs text-slate-500">
              Assembly of parameterized SELECT/FILTER queries with proper prefixes and namespace mapping.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">4</span>
              Fuseki HTTP Execution
            </div>
            <p className="text-xs text-slate-500">
              Direct dispatch to <code className="font-mono">/edusmart/query</code> with JSON record flattening for presentation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
