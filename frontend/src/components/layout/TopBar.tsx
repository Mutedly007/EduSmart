import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  RefreshCw,
  Server,
  Layers,
} from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';
import { useBackendHealth } from '../../hooks/useBackendHealth';

const routeTitleMap: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Platform overview and subsystem status' },
  '/search': { title: 'Natural Language Search', subtitle: 'Question-to-SPARQL translation pipeline' },
  '/sparql': { title: 'SPARQL Explorer', subtitle: 'Interactive query editor and results inspection' },
  '/graph': { title: 'Knowledge Graph', subtitle: 'Semantic visualization of courses, competencies, and relations' },
  '/data': { title: 'Data Management', subtitle: 'RDF/OWL triplestore administration and dataset synchronization' },
  '/ontology': { title: 'Ontology Overview', subtitle: 'Protégé class hierarchy, properties, and validation reports' },
  '/settings': { title: 'Settings', subtitle: 'Environment endpoints, model configurations, and parameters' },
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [globalQuery, setGlobalQuery] = useState('');
  const currentRoute = routeTitleMap[location.pathname] || {
    title: 'EduSmart',
    subtitle: 'Semantic Web Knowledge Platform',
  };

  const { health, isLoading, isError, refetch } = useBackendHealth(20000);
  const isFusekiOnline = health?.services?.apache_jena_fuseki?.status === 'online';

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(globalQuery.trim())}`);
      setGlobalQuery('');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between gap-4 z-10">
      {/* Title & Breadcrumb */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">EduSmart</span>
          <span className="text-xs text-slate-300">/</span>
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight truncate">
            {currentRoute.title}
          </h1>
        </div>
        <p className="text-[11px] text-slate-500 truncate hidden md:block">
          {currentRoute.subtitle}
        </p>
      </div>

      {/* Global Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Form */}
        <form onSubmit={handleGlobalSearch} className="relative hidden lg:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Search classes, entities (e.g. ESPRIT)..."
            aria-label="Global natural language and entity search"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-500 focus:bg-white transition-all"
          />
        </form>

        {/* Live Status: FastAPI Backend */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          title={
            isLoading
              ? 'Checking backend...'
              : isError
              ? 'FastAPI Backend is offline or unreachable'
              : `FastAPI online (v${health?.version})`
          }
        >
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium hidden sm:inline">Backend:</span>
          {isLoading ? (
            <span className="text-slate-400 text-[11px]">Checking...</span>
          ) : isError ? (
            <StatusDot status="offline" label="Offline" />
          ) : (
            <StatusDot status="online" label="Online" showPing={true} />
          )}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Refresh backend health"
            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status: Fuseki Live Indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          title={health?.services?.apache_jena_fuseki?.details || 'Apache Jena Fuseki SPARQL Endpoint'}
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">Fuseki:</span>
          {isFusekiOnline ? (
            <StatusDot status="online" label="Online" showPing={true} />
          ) : (
            <StatusDot status="standby" label="Standby" />
          )}
        </div>

        {/* Notification Icon Placeholder (Inactive) */}
        <button
          type="button"
          disabled
          aria-label="Notifications (inactive)"
          title="Notifications placeholder (not configured in Phase 1)"
          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 cursor-not-allowed bg-slate-50"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Profile / Avatar Placeholder */}
        <div
          className="flex items-center gap-2 pl-2 border-l border-slate-200 select-none"
          title="Academic Researcher profile placeholder (Authentication not configured)"
        >
          <div className="w-8 h-8 rounded-full bg-edu-100 text-edu-700 border border-edu-200 flex items-center justify-center font-semibold text-xs">
            ES
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">Academic User</div>
            <div className="text-[10px] text-slate-500 leading-tight">Web Semantics Team</div>
          </div>
        </div>
      </div>
    </header>
  );
};
