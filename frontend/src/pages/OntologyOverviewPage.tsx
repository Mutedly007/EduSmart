import React from 'react';
import {
  FileCode2,
  Cpu,
  ExternalLink,
  BookOpen,
  FolderTree,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const OntologyOverviewPage: React.FC = () => {
  const namespaces = [
    { prefix: 'edu:', uri: 'http://edusmart.org/ontology#', role: 'EduSmart Domain Ontology' },
    { prefix: 'rdf:', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', role: 'RDF Syntax & Typing' },
    { prefix: 'rdfs:', uri: 'http://www.w3.org/2000/01/rdf-schema#', role: 'Schema Vocabularies & Labels' },
    { prefix: 'owl:', uri: 'http://www.w3.org/2002/07/owl#', role: 'Web Ontology Language Axioms' },
    { prefix: 'xsd:', uri: 'http://www.w3.org/2001/XMLSchema#', role: 'XML Schema Datatypes' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold mb-2 border border-emerald-200">
          <FileCode2 className="w-3.5 h-3.5" /> Domain Ontology & Knowledge Representation
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Ontology Architecture & Specifications
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Overview of the Education and Training domain ontology modeled in Protégé, validated with
          the HermiT DL reasoner, and represented in OWL 2 / RDF.
        </p>
      </div>

      {/* External Desktop Tooling Banner: Protégé & HermiT */}
      <Card
        title="Ontology Engineering Environment: Protégé 5.x & HermiT"
        subtitle="Desktop modeling and description logic reasoning guidelines"
        icon={<Cpu className="w-5 h-5 text-edu-600" />}
        badge={<Badge variant="navy" size="sm">External Desktop Tool</Badge>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Protégé Desktop (v5.6+)</span>
              <a
                href="https://protege.stanford.edu"
                target="_blank"
                rel="noreferrer"
                className="text-edu-600 hover:text-edu-700 flex items-center gap-1 font-medium"
              >
                Official Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Used by the ontology modeling team to construct the Education domain taxonomy, define object/data properties,
              and declare domain/range constraints.
            </p>
            <div className="text-[11px] text-slate-400">
              Output format: OWL/XML or Turtle (<code className="font-mono">edusmart.owl</code>).
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">HermiT Reasoner (v1.4+)</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                Protégé Plugin
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Provides Description Logic (DL) consistency checking, taxonomy classification, and inference verification
              prior to dataset publication in Fuseki.
            </p>
            <div className="text-[11px] text-slate-400">
              Ensures zero unsatisfiable classes and valid property restrictions.
            </div>
          </div>
        </div>
      </Card>

      {/* Class Hierarchy Browser Placeholder */}
      <Card
        title="Ontology Class Taxonomy Browser"
        subtitle="Hierarchical view of domain concepts (Reserved Workspace)"
        icon={<FolderTree className="w-5 h-5 text-edu-600" />}
        badge={<Badge variant="gray" size="sm">Awaiting Ingestion</Badge>}
      >
        <div className="p-8 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center text-center">
          <FolderTree className="w-10 h-10 text-slate-300 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">Class Taxonomy Browser Standby</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-md">
            The interactive tree explorer will render the class hierarchy (e.g. <code className="text-slate-700 font-mono">owl:Thing &gt; edu:EducationalResource &gt; edu:Course</code>)
            once the ontology file is ingested and parsed by RDFLib.
          </p>
        </div>
      </Card>

      {/* Namespace Prefix Table */}
      <Card
        title="Standard Namespace Prefixes"
        subtitle="URI bindings configured for the EduSmart knowledge platform"
        icon={<BookOpen className="w-5 h-5 text-edu-600" />}
      >
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Prefix</th>
                <th className="px-4 py-3">Namespace URI</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {namespaces.map((ns, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-bold text-edu-700">{ns.prefix}</td>
                  <td className="px-4 py-2.5 text-slate-600">{ns.uri}</td>
                  <td className="px-4 py-2.5 font-sans text-slate-500">{ns.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
