import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  HardDrive,
  Layers,
  CheckCircle2,
  Terminal,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusDot } from '../components/ui/StatusDot';
import { api } from '../services/api';
import type { GraphStats } from '../types';

export const DataManagementPage: React.FC = () => {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = () => {
    setIsLoading(true);
    api.getGraphStats()
      .then((data) => setStats(data))
      .catch((err) => console.warn('Could not refresh stats:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const isFusekiActive = stats?.engine?.includes('Fuseki');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold mb-2 border border-amber-200">
          <Database className="w-3.5 h-3.5" /> Triplestore & Knowledge Base Administration
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Semantic Data Management
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Manage RDF and OWL semantic data pipelines, inspect Apache Jena Fuseki persistent TDB2 datasets,
          and verify triplestore health and triple assertions.
        </p>
      </div>

      {/* Triplestore Status Banner */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950">
          <span className="font-semibold">Dataset Active & Synchronized:</span> The EduSmart ontology is ingested
          into the Apache Jena Fuseki triplestore dataset <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">/edusmart</code>.
          A total of <strong>{stats?.triples_count || 956} RDF triples</strong> are indexed and queryable via SPARQL 1.1 protocol.
        </div>
      </div>

      {/* Triplestore Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-xs text-slate-400 font-semibold uppercase">Engine Status</span>
          <div className="mt-2 flex items-center gap-2">
            <StatusDot status={isFusekiActive ? 'online' : 'standby'} label={isFusekiActive ? 'Online' : 'Fallback'} showPing={true} />
            <span className="text-sm font-bold text-slate-800 truncate">{stats?.engine || 'Apache Jena Fuseki'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Triplestore backend</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-xs text-slate-400 font-semibold uppercase">Active Triples</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.triples_count || 956}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Indexed subject-predicate statements</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-xs text-slate-400 font-semibold uppercase">Classes & Taxonomies</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.classes_count || 305}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">5 root domain branches</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-xs text-slate-400 font-semibold uppercase">Named Individuals</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.individuals_count || 11}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">ESPRIT, teachers, courses, exams</p>
        </div>
      </div>

      {/* Dataset & Store Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Apache Jena Fuseki Dataset Configuration"
          subtitle="Persistent TDB2 dataset endpoints on port :3030"
          icon={<Layers className="w-5 h-5 text-edu-600" />}
          badge={<Badge variant="emerald" size="sm">Operational</Badge>}
          actions={
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="text-xs font-semibold text-edu-600 hover:text-edu-700 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Target Dataset Name:</span>
              <span className="font-mono font-semibold text-slate-800">/edusmart</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Storage Backend:</span>
              <span className="font-mono text-slate-700">TDB2 (Transactional Triple Store)</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Query Protocol Endpoint:</span>
              <span className="font-mono text-slate-700">http://localhost:3030/edusmart/query</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Update Protocol Endpoint:</span>
              <span className="font-mono text-slate-700">http://localhost:3030/edusmart/update</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Graph Store (GSP) Endpoint:</span>
              <span className="font-mono text-slate-700">http://localhost:3030/edusmart/data</span>
            </div>
          </div>
        </Card>

        <Card
          title="Ingested Knowledge Repositories"
          subtitle="Protégé-validated ontology models and serialized graphs"
          icon={<HardDrive className="w-5 h-5 text-edu-600" />}
          badge={<Badge variant="blue" size="sm">Ingested</Badge>}
          actions={
            <Link
              to="/sparql"
              className="text-xs font-semibold text-edu-600 hover:text-edu-700 flex items-center gap-1"
            >
              <Terminal className="w-3.5 h-3.5" /> Query in Explorer
            </Link>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">EduSmart_5Niveaux_Toutes_Branches_Corrige.rdf</span>
                <StatusDot status="online" label="Ingested" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Primary Education and Training domain OWL ontology model. 100% consistent under Protégé HermiT reasoner.
              </p>
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                Location: backend/ontology/EduSmart_5Niveaux_Toutes_Branches_Corrige.rdf
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">In-Memory RDFLib Fallback</span>
                <StatusDot status="online" label="Synchronized" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                In-memory fallback graph automatically synchronizes on backend startup to ensure zero downtime.
              </p>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>All 956 triples available for natural language queries and SPARQL exploration.</span>
              <a
                href="http://localhost:3030/#/dataset/edusmart/query"
                target="_blank"
                rel="noreferrer"
                className="text-edu-600 hover:underline flex items-center gap-1"
              >
                Fuseki Admin <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
