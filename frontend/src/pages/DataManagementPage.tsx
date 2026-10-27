import React from 'react';
import {
  Database,
  UploadCloud,
  HardDrive,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusDot } from '../components/ui/StatusDot';

export const DataManagementPage: React.FC = () => {
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
          Manage RDF and OWL semantic data pipelines, ingest Protégé-validated ontology models,
          and configure Apache Jena Fuseki persistent datasets.
        </p>
      </div>

      {/* Triplestore Status Banner */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <span className="font-semibold">Phase 1 Standby Notice:</span> Data ingestion and triplestore mutations
          are intentionally disabled in this initialization phase. No RDF triples will be uploaded or committed until
          the ontology validation phase in Protégé is complete.
        </div>
      </div>

      {/* Ingestion & Upload Section */}
      <Card
        title="RDF / OWL Dataset Upload Pipeline"
        subtitle="Ingest validated ontologies and education instance graphs"
        icon={<UploadCloud className="w-5 h-5 text-edu-600" />}
        badge={<Badge variant="amber" size="sm">Phase 3 Feature</Badge>}
      >
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Semantic Data Ingestion Pipeline (Standby)
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md">
            Drag and drop validated <code className="text-slate-700 font-mono">.owl</code>,{' '}
            <code className="text-slate-700 font-mono">.ttl</code>,{' '}
            <code className="text-slate-700 font-mono">.rdf</code>, or{' '}
            <code className="text-slate-700 font-mono">.jsonld</code> files here. In Phase 3, this will trigger
            RDFLib syntax validation and POST to Fuseki.
          </p>

          <button
            type="button"
            disabled
            className="mt-4 px-4 py-2 bg-slate-200 text-slate-400 text-xs font-semibold rounded-lg cursor-not-allowed select-none"
          >
            Select Ontology Files (Disabled in Phase 1)
          </button>
        </div>
      </Card>

      {/* Dataset & Store Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Apache Jena Fuseki Dataset Configuration"
          subtitle="Target dataset endpoints on port :3030"
          icon={<Layers className="w-5 h-5 text-edu-600" />}
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Target Dataset Name:</span>
              <span className="font-mono font-semibold text-slate-800">edusmart</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Storage Backend:</span>
              <span className="font-mono text-slate-700">TDB2 (Transactional Triple Store)</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Query Protocol Endpoint:</span>
              <span className="font-mono text-slate-700">/edusmart/query</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Update Protocol Endpoint:</span>
              <span className="font-mono text-slate-700">/edusmart/update</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Graph Store Endpoint:</span>
              <span className="font-mono text-slate-700">/edusmart/data</span>
            </div>
          </div>
        </Card>

        <Card
          title="Local File System Repositories"
          subtitle="Ontology files and serialized graphs"
          icon={<HardDrive className="w-5 h-5 text-edu-600" />}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">edusmart.owl</span>
                <StatusDot status="unconfigured" label="Not Loaded" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Primary Education and Training domain OWL ontology model. Path: <code className="font-mono">./ontology/edusmart.owl</code>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">curriculum_data.ttl</span>
                <StatusDot status="unconfigured" label="Not Loaded" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Course instances and learning competency individuals.
              </p>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              Files will be automatically synchronized into RDFLib graph store once present in the repository.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
