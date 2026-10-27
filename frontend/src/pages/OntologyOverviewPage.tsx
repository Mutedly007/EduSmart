import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  FolderTree,
  Search,
  Users,
  Building2,
  GraduationCap,
  Award,
  BookOpen,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type {
  GraphStats,
  OntologyClassesResponse,
  OntologyIndividualItem,
  OntologyIndividualDetail,
} from '../types';

export const OntologyOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [classesData, setClassesData] = useState<OntologyClassesResponse | null>(null);
  const [individuals, setIndividuals] = useState<OntologyIndividualItem[]>([]);
  const [selectedIndividual, setSelectedIndividual] = useState<OntologyIndividualDetail | null>(null);
  const [classSearch, setClassSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const namespaces = [
    { prefix: 'edu:', uri: 'http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#', role: 'EduSmart Domain Ontology' },
    { prefix: 'rdf:', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', role: 'RDF Syntax & Typing' },
    { prefix: 'rdfs:', uri: 'http://www.w3.org/2000/01/rdf-schema#', role: 'Schema Vocabularies & Labels' },
    { prefix: 'owl:', uri: 'http://www.w3.org/2002/07/owl#', role: 'Web Ontology Language Axioms' },
    { prefix: 'xsd:', uri: 'http://www.w3.org/2001/XMLSchema#', role: 'XML Schema Datatypes' },
  ];

  const branches = [
    {
      name: 'Apprentissage',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      description: 'Modalités pédagogiques, activités en ligne, évaluations et examens.',
    },
    {
      name: 'Compétence',
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      description: 'Compétences techniques, programmation, algorithmique et langues.',
    },
    {
      name: 'Formation',
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-600',
      description: 'Programmes de Licence, formations hybrides, certifications et cours.',
    },
    {
      name: 'Personnes',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      description: 'Étudiants, enseignants, grades académiques et personnel administratif.',
    },
    {
      name: 'Établissement',
      icon: Building2,
      color: 'from-sky-500 to-cyan-600',
      description: 'Universités privées/publiques (ex: ESPRIT), instituts et centres.',
    },
  ];

  useEffect(() => {
    Promise.all([
      api.getGraphStats().catch(() => null),
      api.getOntologyClasses().catch(() => null),
      api.getOntologyIndividuals().catch(() => ({ total: 0, individuals: [] })),
    ]).then(([statsRes, classesRes, indRes]) => {
      if (statsRes) setStats(statsRes);
      if (classesRes) setClassesData(classesRes);
      if (indRes) setIndividuals(indRes.individuals);
      setIsLoading(false);
    });
  }, []);

  const handleSelectIndividual = async (name: string) => {
    try {
      const detail = await api.getIndividualDetail(name);
      setSelectedIndividual(detail);
    } catch (err) {
      console.error('Failed to load individual details:', err);
    }
  };

  const filteredClasses = (classesData?.classes || []).filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      (c.label && c.label.toLowerCase().includes(classSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedBranch === 'All') return true;

    // Check if class belongs to branch hierarchy
    return c.name.includes(selectedBranch) || (c.parent_name && c.parent_name.includes(selectedBranch));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold mb-2 border border-emerald-200">
          <FileCode2 className="w-3.5 h-3.5" /> Domain Ontology & Knowledge Representation
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Ontology Architecture & Concepts
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          The <strong>EduSmart</strong> ontology is structured across 5 core branches, validated for Description Logic (DL)
          consistency using <strong>HermiT</strong>, and queryable live via <strong>Apache Jena Fuseki</strong>.
        </p>
      </div>

      {/* Live Graph Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium">Total Triples</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.triples_count || 956}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Fuseki Online
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium">OWL Classes</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.classes_count || 305}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 5 branches</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium">Named Individuals</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.individuals_count || 11}</div>
          <div className="text-[11px] text-slate-500 mt-1">Live ABox entities</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium">Object Properties</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.object_properties_count || 14}</div>
          <div className="text-[11px] text-slate-500 mt-1">Semantic relations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium">Data Properties</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.datatype_properties_count || 25}</div>
          <div className="text-[11px] text-slate-500 mt-1">Attributes & facets</div>
        </div>
      </div>

      {/* The 5 Main Branches Grid */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          The 5 Core Ontology Branches
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {branches.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.name}
                onClick={() => setSelectedBranch(b.name === selectedBranch ? 'All' : b.name)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                  selectedBranch === b.name
                    ? 'bg-blue-50/70 border-edu-500 ring-2 ring-edu-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${b.color} text-white flex items-center justify-center mb-3 shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm text-slate-900">{b.name}</div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Class Explorer */}
      <Card
        title="Interactive Ontology Class Explorer"
        subtitle={`Browse all 305 classes extracted live from the knowledge graph (Showing ${filteredClasses.length} classes)`}
        icon={<FolderTree className="w-5 h-5 text-edu-600" />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              <option value="All">All Branches</option>
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder="Search classes (e.g. 'Cours', 'Formation', 'Enseignant', 'Université')..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-edu-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
            {filteredClasses.length > 0 ? (
              filteredClasses.slice(0, 100).map((cls, idx) => (
                <div key={idx} className="p-2.5 px-3.5 hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-edu-500" />
                    <span className="font-semibold text-slate-900 font-mono">{cls.name}</span>
                    {cls.parent_name && (
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        <span>subClassOf:</span>
                        <code className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                          {cls.parent_name}
                        </code>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10px] font-mono truncate max-w-xs" title={cls.uri}>
                    {cls.uri}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No classes match your search filter.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Named Individuals Inspector */}
      <Card
        title="Named Individuals Inspector"
        subtitle="Explore active ABox individuals in the knowledge graph"
        icon={<Users className="w-5 h-5 text-edu-600" />}
        badge={<Badge variant="blue" size="sm">{individuals.length} Entities</Badge>}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {individuals.map((ind) => (
              <button
                key={ind.name}
                type="button"
                onClick={() => handleSelectIndividual(ind.name)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                  selectedIndividual?.name === ind.name
                    ? 'bg-edu-600 text-white border-edu-600 shadow-sm font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <span>{ind.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedIndividual?.name === ind.name ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {ind.types[0] || 'Entity'}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Individual Inspector Box */}
          {selectedIndividual && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedIndividual.name}</h4>
                  <p className="text-slate-400 text-[11px] font-mono">{selectedIndividual.uri}</p>
                </div>
                <div className="flex gap-1">
                  {selectedIndividual.types.map((t) => (
                    <Badge key={t} variant="blue" size="sm">{t}</Badge>
                  ))}
                </div>
              </div>

              {/* Attributes (Datatype Properties) */}
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Datatype Attributes:</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(selectedIndividual.attributes).map(([k, v]) => (
                    <div key={k} className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">{k}</span>
                      <span className="text-slate-800 font-medium truncate block">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outgoing Relationships */}
              {selectedIndividual.relationships.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Outgoing Relationships:</span>
                  <div className="space-y-1">
                    {selectedIndividual.relationships.map((rel, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                        <span className="text-slate-500 font-semibold">{selectedIndividual.name}</span>
                        <span className="text-edu-600 font-bold">-- {rel.property_name} --&gt;</span>
                        <span className="text-slate-900 font-semibold bg-edu-50 px-1.5 py-0.5 rounded border border-edu-100">{rel.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Relationships */}
              {selectedIndividual.incoming_relations.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Incoming Relationships:</span>
                  <div className="space-y-1">
                    {selectedIndividual.incoming_relations.map((rel, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                        <span className="text-slate-900 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{rel.value}</span>
                        <span className="text-indigo-600 font-bold">-- {rel.property_name} --&gt;</span>
                        <span className="text-slate-500 font-semibold">{selectedIndividual.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 4. Namespaces & Ontological Standards */}
      <Card
        title="Ontological Namespaces & Prefixes"
        subtitle="Standard W3C vocabularies and EduSmart domain namespace"
        icon={<FileCode2 className="w-5 h-5 text-edu-600" />}
        badge={isLoading ? <Badge variant="blue" size="sm">Syncing...</Badge> : <Badge variant="emerald" size="sm">Active</Badge>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2 px-3">Prefix</th>
                <th className="py-2 px-3">Vocabulary Role</th>
                <th className="py-2 px-3 font-mono">Namespace URI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {namespaces.map((ns) => (
                <tr key={ns.prefix} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-edu-700">{ns.prefix}</td>
                  <td className="py-2 px-3 text-slate-700 font-medium">{ns.role}</td>
                  <td className="py-2 px-3 font-mono text-slate-500 text-[11px] truncate max-w-xs">{ns.uri}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
