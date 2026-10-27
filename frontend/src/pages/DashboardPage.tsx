import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Terminal,
  Share2,
  Database,
  FileCode2,
  ArrowRight,
  Server,
  Layers,
  Cpu,
  Info,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusDot } from '../components/ui/StatusDot';
import { useBackendHealth } from '../hooks/useBackendHealth';

export const DashboardPage: React.FC = () => {
  const { health, isLoading, isError } = useBackendHealth();
  const [nlQuery, setNlQuery] = useState('');

  const sampleQuestions = [
    'What courses have prerequisites in Python?',
    'List all competencies required for the Data Science diploma',
    'Which instructors teach Machine Learning in Semester 1?',
    'Show accredited training modules for Web Semantics',
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-subtle relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-edu-50 border border-edu-200 rounded-full text-xs font-semibold text-edu-700 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Web Semantics Academic Project — Phase 1
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome to EduSmart
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
            A Semantic Web knowledge platform for the <strong>Education and Training</strong> domain.
            Designed to bridge structured OWL/RDF domain ontologies, Apache Jena Fuseki SPARQL endpoints,
            and rule-based natural language translation.
          </p>
        </div>

        {/* 2. Prominent Natural Language Question Input */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label htmlFor="dashboard-nl-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Ask the Semantic Knowledge Graph
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="dashboard-nl-input"
                type="text"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="Ask a question in natural language (e.g. 'What are the prerequisites for Advanced AI?')..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-500 focus:bg-white transition-all"
              />
            </div>
            <button
              type="button"
              disabled
              title="Question-to-SPARQL translation engine will be activated in Phase 2"
              className="px-5 py-3 rounded-xl bg-slate-200 text-slate-400 text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2 select-none"
            >
              Translate & Query
              <Badge variant="gray" size="sm">Phase 2</Badge>
            </button>
          </div>

          {/* Sample Prompts */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Illustrative queries:</span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNlQuery(q)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-blue-50/60 border border-blue-100 p-2.5 rounded-lg">
            <Info className="w-4 h-4 text-edu-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>NLP Translation Note:</strong> In accordance with university specifications, query translation will use 
              local TALN techniques and custom grammar rules (via spaCy). No hosted commercial LLM APIs are used.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Truthful Semantic Data Connection Status Area */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Semantic Infrastructure & Subsystems Status
          </h2>
          <span className="text-xs text-slate-400">Strictly verified indicators</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: FastAPI Backend */}
          <Card
            title="FastAPI Python Backend"
            subtitle="Core application HTTP API"
            icon={<Server className="w-5 h-5 text-edu-600" />}
            badge={
              isLoading ? (
                <StatusDot status="warning" label="Verifying" />
              ) : isError ? (
                <StatusDot status="offline" label="Offline" />
              ) : (
                <StatusDot status="online" label="Online" showPing={true} />
              )
            }
          >
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-slate-800">
                  {isLoading ? 'Checking endpoint...' : isError ? 'Unreachable' : 'Operational'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Version:</span>
                <span className="font-mono text-slate-700">{health?.version || '0.1.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Local URL:</span>
                <span className="font-mono text-slate-700">http://127.0.0.1:8000</span>
              </div>
              <p className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-normal">
                {isError
                  ? 'Run the FastAPI backend with uvicorn to enable local API health verification.'
                  : 'FastAPI server running with CORS enabled for frontend exploration.'}
              </p>
            </div>
          </Card>

          {/* Card B: Apache Jena Fuseki */}
          <Card
            title="Apache Jena Fuseki"
            subtitle="SPARQL 1.1 Triplestore Server"
            icon={<Layers className="w-5 h-5 text-amber-600" />}
            badge={<StatusDot status="standby" label="Standby" />}
          >
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-amber-700">Not Connected (Standby)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Endpoint:</span>
                <span className="font-mono text-slate-700">:3030/edusmart/query</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TDB2 Datasets:</span>
                <span className="text-slate-500 italic">None initialized</span>
              </div>
              <p className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-normal">
                Standby state in Phase 1. Instructions and Docker Compose configurations are ready in{' '}
                <code className="text-slate-700 font-mono">infrastructure/fuseki</code>.
              </p>
            </div>
          </Card>

          {/* Card C: Protégé & HermiT Reasoner */}
          <Card
            title="Protégé & HermiT Reasoner"
            subtitle="Ontology modeling & validation"
            icon={<Cpu className="w-5 h-5 text-indigo-600" />}
            badge={<StatusDot status="unconfigured" label="External Tool" />}
          >
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Modeling Phase:</span>
                <span className="font-semibold text-slate-700">Desktop Validation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reasoner:</span>
                <span className="font-mono text-slate-700">HermiT 1.4.x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ontology File:</span>
                <span className="text-slate-500 italic">Pending modeling</span>
              </div>
              <p className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-normal">
                Protégé is maintained as an external desktop tool. Verified OWL/RDF files will be linked once team modeling concludes.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Neutral Placeholder Metrics Cards (Clearly marked "Not configured") */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Ontology & Knowledge Graph Metrics
          </h2>
          <span className="text-xs text-slate-400">Neutral placeholders (No fabricated metrics)</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-subtle">
            <span className="text-xs font-medium text-slate-500">Ontological Classes</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-300">—</span>
              <span className="text-xs text-slate-400 font-mono">Pending Model</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Classes such as Course, Competency, Degree</p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-subtle">
            <span className="text-xs font-medium text-slate-500">RDF Triples Stored</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-300">0</span>
              <span className="text-xs text-slate-400 font-mono">Awaiting Fuseki</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Subject-Predicate-Object statements</p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-subtle">
            <span className="text-xs font-medium text-slate-500">Object & Data Properties</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-300">—</span>
              <span className="text-xs text-slate-400 font-mono">Pending Model</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">e.g. hasPrerequisite, teachesSkill</p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-subtle">
            <span className="text-xs font-medium text-slate-500">Indexed Educational Entities</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-300">—</span>
              <span className="text-xs text-slate-400 font-mono">Pending Dataset</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Individuals and curricula instances</p>
          </div>
        </div>
      </div>

      {/* 5. Previews: SPARQL Workspace & Knowledge Graph Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SPARQL Illustrative Workspace Preview */}
        <Card
          title="SPARQL Workspace Preview"
          subtitle="Illustrative SPARQL 1.1 query syntax (Not executed)"
          icon={<Terminal className="w-5 h-5 text-edu-600" />}
          actions={
            <Link
              to="/sparql"
              className="text-xs font-semibold text-edu-600 hover:text-edu-700 flex items-center gap-1"
            >
              Open Explorer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="bg-slate-900 text-slate-200 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-slate-800">
            <div className="text-slate-500 mb-1"># Sample Education & Training Domain Query</div>
            <div><span className="text-purple-400">PREFIX</span> <span className="text-sky-300">edu:</span> &lt;http://edusmart.org/ontology#&gt;</div>
            <div><span className="text-purple-400">PREFIX</span> <span className="text-sky-300">rdfs:</span> &lt;http://www.w3.org/2000/01/rdf-schema#&gt;</div>
            <div className="mt-2"><span className="text-blue-400">SELECT</span> <span className="text-yellow-300">?course ?courseLabel ?credits</span></div>
            <div><span className="text-blue-400">WHERE</span> &#123;</div>
            <div className="pl-4">
              <span className="text-yellow-300">?course</span> <span className="text-pink-400">a</span> <span className="text-sky-300">edu:Course</span> ;<br />
              <span className="pl-8 text-sky-300">rdfs:label</span> <span className="text-yellow-300">?courseLabel</span> ;<br />
              <span className="pl-8 text-sky-300">edu:hasCredits</span> <span className="text-yellow-300">?credits</span> .
            </div>
            <div className="pl-4">
              <span className="text-blue-400">FILTER</span>(<span className="text-yellow-300">?credits</span> &gt;= <span className="text-emerald-400">4</span>)
            </div>
            <div>&#125;</div>
            <div><span className="text-blue-400">LIMIT</span> <span className="text-emerald-400">10</span></div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Direct SPARQL execution against Jena Fuseki will be enabled once the triplestore dataset is loaded in Phase 3.
          </p>
        </Card>

        {/* Knowledge Graph Preview Canvas */}
        <Card
          title="Knowledge Graph Visualizer Preview"
          subtitle="Interactive RDF node-link representation"
          icon={<Share2 className="w-5 h-5 text-edu-600" />}
          actions={
            <Link
              to="/graph"
              className="text-xs font-semibold text-edu-600 hover:text-edu-700 flex items-center gap-1"
            >
              Open Graph View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="h-48 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-edu-600 mb-3">
              <Share2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">Knowledge Graph Standby</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Visual canvas ready. Course entities, prerequisite relationships, and skill taxonomies
              will render interactively when the RDF graph is connected.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="navy" size="sm">Course Nodes</Badge>
              <Badge variant="navy" size="sm">Prerequisite Edges</Badge>
              <Badge variant="navy" size="sm">Competency Clusters</Badge>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            SVG and Canvas-based force-directed rendering will be powered by the backend graph service.
          </p>
        </Card>
      </div>

      {/* 6. Quick Access Cards for Planned Modules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Planned Platform Modules
          </h2>
          <span className="text-xs text-slate-400">Navigate to module workspaces</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/search"
            className="group p-5 bg-white border border-slate-200/90 rounded-xl hover:border-edu-300 hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-edu-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Search className="w-4 h-4" />
              </div>
              <Badge variant="blue" size="sm">NLP / TALN</Badge>
            </div>
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-edu-700 transition-colors">
              Natural Language Search
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Query educational concepts in plain language translated directly into SPARQL without external LLM dependencies.
            </p>
          </Link>

          <Link
            to="/sparql"
            className="group p-5 bg-white border border-slate-200/90 rounded-xl hover:border-edu-300 hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Terminal className="w-4 h-4" />
              </div>
              <Badge variant="navy" size="sm">W3C Standard</Badge>
            </div>
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-edu-700 transition-colors">
              SPARQL Explorer
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Interactive code editor for formulating, validating, and testing SPARQL 1.1 SELECT, CONSTRUCT, and ASK queries.
            </p>
          </Link>

          <Link
            to="/graph"
            className="group p-5 bg-white border border-slate-200/90 rounded-xl hover:border-edu-300 hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <Badge variant="navy" size="sm">Visual Graph</Badge>
            </div>
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-edu-700 transition-colors">
              Knowledge Graph
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Explore interconnected academic nodes, prerequisites, competencies, and instructors in an interactive visual canvas.
            </p>
          </Link>

          <Link
            to="/data"
            className="group p-5 bg-white border border-slate-200/90 rounded-xl hover:border-edu-300 hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Database className="w-4 h-4" />
              </div>
              <Badge variant="amber" size="sm">Triple Store</Badge>
            </div>
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-edu-700 transition-colors">
              Data Management
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Manage RDF datasets, sync with Apache Jena Fuseki, and inspect triplestore health and persistence statistics.
            </p>
          </Link>

          <Link
            to="/ontology"
            className="group p-5 bg-white border border-slate-200/90 rounded-xl hover:border-edu-300 hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileCode2 className="w-4 h-4" />
              </div>
              <Badge variant="emerald" size="sm">OWL 2 / RDFS</Badge>
            </div>
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-edu-700 transition-colors">
              Ontology Overview
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inspect class taxonomies, property hierarchies, namespace prefixes, and Protégé HermiT reasoner checks.
            </p>
          </Link>

          <Link
            to="/settings"
            className="group p-5 bg-white border border-slate-200/90 rounded-xl hover:border-edu-300 hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cpu className="w-4 h-4" />
              </div>
              <Badge variant="gray" size="sm">Environment</Badge>
            </div>
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-edu-700 transition-colors">
              Settings & Config
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Review backend connection endpoints, Fuseki URLs, spaCy language models, and system parameters.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
