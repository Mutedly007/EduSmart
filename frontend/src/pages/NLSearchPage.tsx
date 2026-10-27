import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Terminal,
  FileQuestion,
  Cpu,
  Layers,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const NLSearchPage: React.FC = () => {
  const [question, setQuestion] = useState('');

  const sampleQuestions = [
    'What courses have prerequisites in Python?',
    'List all competencies required for the Data Science diploma',
    'Which instructors teach Machine Learning in Semester 1?',
    'Show accredited training modules for Web Semantics',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-edu-700 rounded-full text-xs font-semibold mb-2 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" /> NLP / TALN Question Answering Subsystem
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Natural Language Question Interface
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Ask questions in plain English or French. The future custom NLP/TALN translation module 
          will analyze questions linguistically using spaCy and map identified educational entities 
          directly into executable SPARQL 1.1 queries without using hosted LLMs.
        </p>
      </div>

      {/* Question Input Card */}
      <Card
        title="Query Input"
        subtitle="Formulate natural language questions regarding courses, prerequisites, or skills"
        icon={<Search className="w-5 h-5 text-edu-600" />}
      >
        <div className="space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question here (e.g. 'Which introductory courses teach Python programming and data structures?')..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-500 focus:bg-white resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Sample queries:</span>
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestion(q)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled
              title="Translation engine will be activated in Phase 2"
              className="px-5 py-2.5 rounded-lg bg-slate-200 text-slate-400 text-sm font-semibold cursor-not-allowed flex items-center gap-2 select-none"
            >
              Generate SPARQL & Execute
              <Badge variant="gray" size="sm">Phase 2</Badge>
            </button>
          </div>
        </div>
      </Card>

      {/* Planned TALN Translation Pipeline Architecture Diagram */}
      <Card
        title="Translation Architecture (Rule-based TALN Pipeline)"
        subtitle="Deterministic NLP-to-SPARQL pipeline designed for the university project"
        icon={<Cpu className="w-5 h-5 text-edu-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">1</span>
              Linguistic Analysis
            </div>
            <p className="text-xs text-slate-500">
              spaCy tokenization, POS tagging, lemmatization, and dependency parsing.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">2</span>
              Intent & Entities
            </div>
            <p className="text-xs text-slate-500">
              Identify domain entities (Course, Skill, Instructor) and question intention.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">3</span>
              Ontology Mapping
            </div>
            <p className="text-xs text-slate-500">
              Map recognized entities to ontology classes, URIs, and relationships.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">4</span>
              SPARQL Assembly
            </div>
            <p className="text-xs text-slate-500">
              Construct syntactically valid SPARQL 1.1 query dispatched to Fuseki.
            </p>
          </div>
        </div>
      </Card>

      {/* Two Column Output Placeholder Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder A: Generated SPARQL Query */}
        <Card
          title="Generated SPARQL Translation"
          subtitle="Output of the question-to-SPARQL translation pipeline"
          icon={<Terminal className="w-5 h-5 text-edu-600" />}
          badge={<Badge variant="gray" size="sm">Awaiting Pipeline</Badge>}
        >
          <div className="h-44 border border-dashed border-slate-200 rounded-lg bg-slate-50/60 flex flex-col items-center justify-center p-6 text-center">
            <Terminal className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-600">No SPARQL Generated Yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              When a question is processed in Phase 2, the corresponding SPARQL query will appear here with syntax highlighting.
            </p>
          </div>
        </Card>

        {/* Placeholder B: Query Results */}
        <Card
          title="Query Execution Results"
          subtitle="JSON tabular response from Fuseki SPARQL endpoint"
          icon={<Layers className="w-5 h-5 text-edu-600" />}
          badge={<Badge variant="gray" size="sm">Awaiting Execution</Badge>}
        >
          <div className="h-44 border border-dashed border-slate-200 rounded-lg bg-slate-50/60 flex flex-col items-center justify-center p-6 text-center">
            <FileQuestion className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-600">No Query Results</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Triplestore query results will be rendered in a responsive data table with export options.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
