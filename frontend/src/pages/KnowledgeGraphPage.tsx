import React from 'react';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Info,
  CircleDot,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const KnowledgeGraphPage: React.FC = () => {
  const ontologyClasses = [
    { name: 'Course', count: 'Standby', color: 'bg-blue-500' },
    { name: 'Competency', count: 'Standby', color: 'bg-emerald-500' },
    { name: 'Prerequisite', count: 'Standby', color: 'bg-amber-500' },
    { name: 'Instructor', count: 'Standby', color: 'bg-purple-500' },
    { name: 'TrainingProgram', count: 'Standby', color: 'bg-indigo-500' },
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
          Interactive node-link visualization representing RDF/OWL graph triples. Explore educational entities,
          curriculum prerequisite networks, instructor competencies, and hierarchical dependencies visually.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Canvas Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Card
            title="Graph Canvas"
            subtitle="Interactive force-directed graph renderer (Reserved Workspace)"
            icon={<Share2 className="w-5 h-5 text-edu-600" />}
            badge={<Badge variant="navy" size="sm">Standby State</Badge>}
            actions={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled
                  title="Zoom in (disabled)"
                  className="p-1.5 rounded bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled
                  title="Zoom out (disabled)"
                  className="p-1.5 rounded bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled
                  title="Fit to screen (disabled)"
                  className="p-1.5 rounded bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            }
          >
            {/* Reserved Visualization Area with Informative Empty State */}
            <div className="relative h-[480px] bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
              {/* Background Geometric Grid Mockup */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Informative Empty State Content */}
              <div className="relative z-10 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 mx-auto flex items-center justify-center text-edu-400 mb-4 shadow-elevated">
                  <Share2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">
                  Knowledge Graph Visualization Area
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  The visual graph engine is configured and waiting for RDF triples. Once the EduSmart ontology
                  and student curriculum datasets are loaded into Apache Jena Fuseki, entities and relationships
                  will be dynamically fetched and rendered here via D3/Force-graph.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                    Engine: SVG/Canvas
                  </span>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                    Format: RDF/JSON-LD
                  </span>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                    Phase 3 Implementation
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Controls & Inspector (1 Col) */}
        <div className="space-y-4">
          {/* Filter Panel Placeholder */}
          <Card
            title="Class Filters"
            subtitle="Filter graph nodes by ontology class"
            icon={<Filter className="w-4 h-4 text-edu-600" />}
          >
            <div className="space-y-2.5">
              {ontologyClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cls.color}`} />
                    <span className="font-medium text-slate-700">{cls.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{cls.count}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-normal">
              Filters will activate upon dataset binding to toggle class node visibility dynamically.
            </p>
          </Card>

          {/* Node Inspector Placeholder */}
          <Card
            title="Entity Inspector"
            subtitle="RDF metadata & properties"
            icon={<Info className="w-4 h-4 text-edu-600" />}
          >
            <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
              <CircleDot className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-slate-600">No Entity Selected</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click on any node in the canvas to inspect its RDF URI, types, and connected axioms.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
