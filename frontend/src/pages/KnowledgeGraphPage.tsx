import React, { useState, useEffect } from 'react';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Info,
  CircleDot,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { OntologyIndividualItem, OntologyIndividualDetail } from '../types';

interface GraphNode {
  id: string;
  name: string;
  category: 'Formation' | 'Personnes' | 'Compétence' | 'Apprentissage' | 'Établissement';
  types: string[];
  x: number;
  y: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export const KnowledgeGraphPage: React.FC = () => {
  const [individuals, setIndividuals] = useState<OntologyIndividualItem[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<OntologyIndividualDetail | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback initial graph nodes if individuals API is still loading
  const baseNodes: GraphNode[] = [
    { id: 'ESPRIT', name: 'ESPRIT', category: 'Établissement', types: ['Universite_Privee', 'Etablissement'], x: 400, y: 150, color: '#0284c7' },
    { id: 'Mohamed_Ben_Salah', name: 'Mohamed Ben Salah', category: 'Personnes', types: ['Professeur', 'Enseignant'], x: 230, y: 240, color: '#9333ea' },
    { id: 'Mariem_Trabelsi', name: 'Mariem Trabelsi', category: 'Personnes', types: ['Maitre_Assistante', 'Enseignant'], x: 570, y: 240, color: '#9333ea' },
    { id: 'Etudiant_1', name: 'Etudiant 1', category: 'Personnes', types: ['Etudiant_Inscrit', 'Etudiant'], x: 180, y: 400, color: '#a855f7' },
    { id: 'Intelligence_Artificielle', name: 'Intelligence Artificielle', category: 'Formation', types: ['Cours_Obligatoire', 'Cours'], x: 300, y: 340, color: '#10b981' },
    { id: 'Machine_Learning', name: 'Machine Learning', category: 'Formation', types: ['Cours_Optionnel', 'Cours'], x: 500, y: 340, color: '#10b981' },
    { id: 'Algorithmique_Avancee', name: 'Algorithmique Avancée', category: 'Formation', types: ['Cours_Fondamental', 'Cours'], x: 400, y: 460, color: '#059669' },
    { id: 'Competence_Python', name: 'Compétence Python', category: 'Compétence', types: ['Competence_Technique'], x: 670, y: 420, color: '#f59e0b' },
    { id: 'Competence_IA', name: 'Compétence IA', category: 'Compétence', types: ['Competence_Academique'], x: 350, y: 220, color: '#d97706' },
    { id: 'Examen_Final', name: 'Examen Final IA', category: 'Apprentissage', types: ['Examen_Ecrit', 'Evaluation'], x: 140, y: 280, color: '#3b82f6' },
    { id: 'Modalite_Hybride', name: 'Modalité Hybride', category: 'Apprentissage', types: ['Formation_Hybride', 'Modalite'], x: 640, y: 150, color: '#2563eb' },
  ];

  const baseLinks: GraphLink[] = [
    { source: 'Intelligence_Artificielle', target: 'Mohamed_Ben_Salah', label: 'estDispensePar' },
    { source: 'Machine_Learning', target: 'Mariem_Trabelsi', label: 'estDispensePar' },
    { source: 'Machine_Learning', target: 'Intelligence_Artificielle', label: 'aPourPrerequis' },
    { source: 'Intelligence_Artificielle', target: 'Algorithmique_Avancee', label: 'aPourPrerequis' },
    { source: 'Machine_Learning', target: 'Competence_Python', label: 'requiertCompetence' },
    { source: 'Intelligence_Artificielle', target: 'Competence_IA', label: 'apporteCompetence' },
    { source: 'Intelligence_Artificielle', target: 'Examen_Final', label: 'evaluePar' },
    { source: 'Etudiant_1', target: 'Intelligence_Artificielle', label: 'estInscritDans' },
    { source: 'Mohamed_Ben_Salah', target: 'ESPRIT', label: 'enseigneDans' },
    { source: 'Mariem_Trabelsi', target: 'ESPRIT', label: 'enseigneDans' },
    { source: 'Machine_Learning', target: 'Modalite_Hybride', label: 'adopteModalite' },
  ];

  useEffect(() => {
    let mounted = true;
    api.getOntologyIndividuals()
      .then((res) => {
        if (mounted && res?.individuals?.length > 0) {
          setIndividuals(res.individuals);
        }
      })
      .catch((err) => {
        console.warn('Could not load individuals for graph:', err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    try {
      const detail = await api.getIndividualDetail(nodeId);
      setSelectedDetail(detail);
    } catch {
      // Find fallback individual if detail request fails
      const found = individuals.find((ind) => ind.name === nodeId);
      if (found) {
        setSelectedDetail({
          uri: found.uri,
          name: found.name,
          types: found.types,
          attributes: found.properties || {},
          relationships: [],
          incoming_relations: [],
        });
      } else {
        const fallbackNode = baseNodes.find((n) => n.id === nodeId);
        setSelectedDetail({
          uri: `http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#${nodeId}`,
          name: fallbackNode?.name || nodeId,
          types: fallbackNode?.types || [],
          attributes: { Identifier: nodeId },
          relationships: baseLinks
            .filter((l) => l.source === nodeId)
            .map((l) => ({ property_uri: '', property_name: l.label, property_type: 'object', value: l.target })),
          incoming_relations: baseLinks
            .filter((l) => l.target === nodeId)
            .map((l) => ({ property_uri: '', property_name: l.label, property_type: 'object', value: l.source })),
        });
      }
    }
  };

  const filteredNodes = baseNodes.filter((node) => {
    const matchesCategory = selectedCategory === 'All' || node.category === selectedCategory;
    const matchesSearch = !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredLinks = baseLinks.filter(
    (l) => visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target)
  );

  const categories = [
    { name: 'All', icon: CircleDot, count: baseNodes.length, color: 'bg-slate-500' },
    { name: 'Formation', icon: GraduationCap, count: 3, color: 'bg-emerald-500' },
    { name: 'Personnes', icon: Users, count: 3, color: 'bg-purple-500' },
    { name: 'Compétence', icon: Award, count: 2, color: 'bg-amber-500' },
    { name: 'Apprentissage', icon: BookOpen, count: 2, color: 'bg-blue-500' },
    { name: 'Établissement', icon: Building2, count: 1, color: 'bg-sky-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-2 border border-indigo-200">
          <Share2 className="w-3.5 h-3.5" /> Semantic Knowledge Graph Explorer
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Ontological Knowledge Graph Visualizer
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Interactive SVG network visualization representing RDF/OWL graph triples. Explore educational entities,
          prerequisite hierarchies, instructor competencies, and relationships in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Canvas Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Card
            title="Interactive Knowledge Canvas"
            subtitle="Force-positioned topological graph of verified ontology individuals"
            icon={<Share2 className="w-5 h-5 text-edu-600" />}
            badge={
              <Badge variant="emerald" size="sm">
                {isLoading ? 'Loading...' : `${filteredNodes.length} Nodes Active`}
              </Badge>
            }
            actions={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
                  title="Zoom in"
                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
                  title="Zoom out"
                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setSelectedCategory('All');
                    setSelectedNodeId(null);
                  }}
                  title="Reset view"
                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            }
          >
            {/* SVG Visual Graph */}
            <div className="relative h-[520px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner select-none">
              {/* Geometric Grid Background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, #60a5fa 1px, transparent 0)',
                  backgroundSize: '28px 28px',
                }}
              />

              <svg
                viewBox={`0 0 800 600`}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="22"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
                  </marker>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* Connecting Links */}
                {filteredLinks.map((link, idx) => {
                  const s = baseNodes.find((n) => n.id === link.source);
                  const t = baseNodes.find((n) => n.id === link.target);
                  if (!s || !t) return null;
                  const isHighlighted = selectedNodeId === s.id || selectedNodeId === t.id;

                  const midX = (s.x + t.x) / 2;
                  const midY = (s.y + t.y) / 2;

                  return (
                    <g key={idx}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={isHighlighted ? '#38bdf8' : '#334155'}
                        strokeWidth={isHighlighted ? 2.5 : 1.2}
                        strokeDasharray={isHighlighted ? 'none' : '4 2'}
                        markerEnd="url(#arrowhead)"
                        className="transition-all duration-300"
                      />
                      <rect
                        x={midX - 35}
                        y={midY - 9}
                        width="70"
                        height="16"
                        rx="4"
                        fill="#0f172a"
                        stroke={isHighlighted ? '#0284c7' : '#1e293b'}
                        strokeWidth="0.8"
                      />
                      <text
                        x={midX}
                        y={midY + 3}
                        fill={isHighlighted ? '#7dd3fc' : '#94a3b8'}
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                        className="pointer-events-none select-none font-semibold"
                      >
                        {link.label}
                      </text>
                    </g>
                  );
                })}

                {/* Graph Nodes */}
                {filteredNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <g
                      key={node.id}
                      onClick={() => handleSelectNode(node.id)}
                      className="cursor-pointer group"
                    >
                      {/* Outer Pulse ring if selected */}
                      {isSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="28"
                          fill="none"
                          stroke={node.color}
                          strokeWidth="2"
                          opacity="0.8"
                          className="animate-ping"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 20 : 16}
                        fill={node.color}
                        stroke={isSelected ? '#ffffff' : '#0f172a'}
                        strokeWidth={isSelected ? 3 : 2}
                        filter={isSelected ? 'url(#glow)' : undefined}
                        className="transition-all duration-200 group-hover:scale-110"
                      />

                      {/* Node Label Card */}
                      <rect
                        x={node.x - 55}
                        y={node.y + 22}
                        width="110"
                        height="20"
                        rx="5"
                        fill="#0f172a"
                        stroke={isSelected ? '#38bdf8' : '#1e293b'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                        opacity="0.95"
                      />
                      <text
                        x={node.x}
                        y={node.y + 36}
                        fill={isSelected ? '#f8fafc' : '#cbd5e1'}
                        fontSize="10"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                      >
                        {node.name.length > 15 ? `${node.name.slice(0, 13)}...` : node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 flex items-center gap-4">
                <span className="font-semibold text-slate-400">Branches:</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Formation</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Personnes</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Compétence</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Apprentissage</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Établissement</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Controls & Node Inspector (1 Col) */}
        <div className="space-y-4">
          {/* Branch Filter Selector */}
          <Card
            title="Ontology Filters"
            subtitle="Toggle visual entity branches"
            icon={<Filter className="w-4 h-4 text-edu-600" />}
          >
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-edu-500"
              />
            </div>
            <div className="space-y-1.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isCatActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      isCatActive
                        ? 'bg-edu-50 border border-edu-200 text-edu-800 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{cat.name}</span>
                    </div>
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 font-mono">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Node Inspector Panel */}
          <Card
            title="Entity Inspector"
            subtitle="Axiom assertions & relationships"
            icon={<Info className="w-4 h-4 text-edu-600" />}
          >
            {selectedDetail ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Selected Entity</span>
                  <div className="font-bold text-sm text-slate-900">{selectedDetail.name}</div>
                  <div className="font-mono text-[10px] text-slate-500 truncate mt-0.5" title={selectedDetail.uri}>
                    {selectedDetail.uri}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Direct OWL Types</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedDetail.types.map((t) => (
                      <Badge key={t} variant="blue" size="sm">{t}</Badge>
                    ))}
                  </div>
                </div>

                {/* Attributes */}
                {Object.keys(selectedDetail.attributes).length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Attributes</span>
                    <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      {Object.entries(selectedDetail.attributes).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">{k}:</span>
                          <span className="text-slate-800 font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relationships */}
                {selectedDetail.relationships.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Outgoing Assertions</span>
                    <div className="space-y-1">
                      {selectedDetail.relationships.map((rel, idx) => (
                        <div key={idx} className="p-1.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
                          <span className="text-edu-600 font-bold block">{rel.property_name}</span>
                          <span className="text-slate-800 font-semibold">{rel.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSelectNode(selectedDetail.name)}
                  className="w-full mt-2 py-1.5 bg-edu-50 hover:bg-edu-100 text-edu-700 font-semibold rounded-lg text-xs border border-edu-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Re-query Node in Fuseki
                </button>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
                <CircleDot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Entity Selected</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Click on any node in the interactive graph canvas above to inspect its RDF properties, direct OWL types, and connected triples.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
