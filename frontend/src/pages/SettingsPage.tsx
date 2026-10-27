import React from 'react';
import {
  Settings,
  Server,
  Layers,
  Cpu,
  HardDrive,
  Info,
  Lock,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const SettingsPage: React.FC = () => {
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
          Static configuration overview for the EduSmart Semantic Web platform. During Phase 1,
          configuration values are managed via environment files (<code className="font-mono">.env</code>) and core settings.
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-edu-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold">Static Configuration Notice:</span> Settings shown below reflect the
          environment variables loaded by the system. In-browser mutation is intentionally disabled to preserve
          environment reproducibility across development machines.
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Backend API Settings */}
        <Card
          title="Backend HTTP API Settings"
          subtitle="FastAPI server parameters"
          icon={<Server className="w-5 h-5 text-edu-600" />}
          badge={<Badge variant="navy" size="sm">Read-Only</Badge>}
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
              <label className="block text-slate-500 font-medium mb-1">API Documentation Endpoints</label>
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
          badge={<Badge variant="amber" size="sm">Standby</Badge>}
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
                value="edusmart"
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
          badge={<Badge variant="blue" size="sm">Rule-Based</Badge>}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Linguistic Processing Library</label>
              <input
                type="text"
                readOnly
                value="spaCy v3.8+ (Local Python dependency)"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Planned Model Name</label>
              <input
                type="text"
                readOnly
                value="en_core_web_sm"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">External Hosted LLM Policy</label>
              <input
                type="text"
                readOnly
                value="Disabled per university Web Semantics specification"
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
          badge={<Badge variant="navy" size="sm">Workspace</Badge>}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Ontology File Location</label>
              <input
                type="text"
                readOnly
                value="./ontology/edusmart.owl"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Default Ontology Graph URI</label>
              <input
                type="text"
                readOnly
                value="http://edusmart.org/ontology#"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">HermiT Reasoner Integration</label>
              <input
                type="text"
                readOnly
                value="External Desktop Validation (Protégé 5.x)"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
