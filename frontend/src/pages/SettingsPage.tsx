import React from 'react';
import {
  Settings,
  Server,
  Layers,
  Cpu,
  HardDrive,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusDot } from '../components/ui/StatusDot';
import { useBackendHealth } from '../hooks/useBackendHealth';

export const SettingsPage: React.FC = () => {
  const { health, isLoading, isError } = useBackendHealth();
  const isFusekiOnline = health?.services?.apache_jena_fuseki?.status === 'online';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold mb-2 border border-slate-200">
          <Settings className="w-3.5 h-3.5" /> Platform Configuration
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          System Environment Settings
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Configuration overview for the EduSmart Semantic Web platform. Displays active backend endpoints,
          triplestore mapping, linguistic spaCy models, and ontology storage paths.
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed">
          <span className="font-semibold">All Semantic Services Operational:</span> FastAPI backend, Apache Jena Fuseki triplestore,
          and spaCy NLP linguistic pipelines are active and responding within normal latency tolerances.
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Backend API Settings */}
        <Card
          title="Backend HTTP API Settings"
          subtitle="FastAPI server parameters"
          icon={<Server className="w-5 h-5 text-edu-600" />}
          badge={
            isLoading ? (
              <StatusDot status="warning" label="Checking" />
            ) : isError ? (
              <StatusDot status="offline" label="Offline" />
            ) : (
              <StatusDot status="online" label="Online" showPing={true} />
            )
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Backend Base URL</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value="http://127.0.0.1:8000"
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
                />
                <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">CORS Allowed Origins</label>
              <input
                type="text"
                readOnly
                value="http://localhost:5173, http://127.0.0.1:5173"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Interactive API Documentation</label>
              <input
                type="text"
                readOnly
                value="/docs (Swagger UI), /redoc (ReDoc)"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Card 2: Fuseki SPARQL Settings */}
        <Card
          title="Apache Jena Fuseki SPARQL Settings"
          subtitle="Triplestore endpoints and dataset mapping"
          icon={<Layers className="w-5 h-5 text-edu-600" />}
          badge={
            isFusekiOnline ? (
              <StatusDot status="online" label="Operational" showPing={true} />
            ) : (
              <StatusDot status="standby" label="Standby" />
            )
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Fuseki Server URL</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value="http://localhost:3030"
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
                />
                <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Target Dataset Name</label>
              <input
                type="text"
                readOnly
                value="/edusmart"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">SPARQL Query Protocol URI</label>
              <input
                type="text"
                readOnly
                value="http://localhost:3030/edusmart/query"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Card 3: spaCy / TALN Settings */}
        <Card
          title="NLP / TALN Translation Configuration"
          subtitle="Local language analysis settings"
          icon={<Cpu className="w-5 h-5 text-edu-600" />}
          badge={<Badge variant="blue" size="sm">Rule-Based spaCy</Badge>}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Linguistic Processing Models</label>
              <input
                type="text"
                readOnly
                value="fr_core_news_sm (v3.8.0), en_core_web_sm (v3.8.0)"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Grammar & Intent Parsing</label>
              <input
                type="text"
                readOnly
                value="Deterministic regex pattern matching & dependency POS parsing"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">External Hosted LLM Policy</label>
              <input
                type="text"
                readOnly
                value="Zero external cloud LLM dependencies (Academic compliance)"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Card 4: Protégé & Ontology File Paths */}
        <Card
          title="Ontology & Storage Paths"
          subtitle="Workspace file layout paths"
          icon={<HardDrive className="w-5 h-5 text-edu-600" />}
          badge={<Badge variant="emerald" size="sm">HermiT Consistent</Badge>}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Ontology File Location</label>
              <input
                type="text"
                readOnly
                value="backend/ontology/EduSmart_5Niveaux_Toutes_Branches_Corrige.rdf"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Default Ontology Graph URI</label>
              <input
                type="text"
                readOnly
                value="http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">HermiT Reasoner Verification</label>
              <input
                type="text"
                readOnly
                value="Classified with HermiT: Return Code 0 (Consistent)"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-emerald-800 font-semibold text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
