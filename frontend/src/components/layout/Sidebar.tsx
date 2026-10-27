import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Search,
  Terminal,
  Share2,
  Database,
  FileCode2,
  Settings,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'System overview & status',
    },
    {
      to: '/personnes',
      label: 'Personnes',
      icon: Users,
      description: 'Gestion des individus (CRUD)',
      badge: 'CRUD',
    },
    {
      to: '/search',
      label: 'Natural Language Search',
      icon: Search,
      description: 'Question-to-SPARQL pipeline',
    },
    {
      to: '/sparql',
      label: 'SPARQL Explorer',
      icon: Terminal,
      description: 'Direct query workspace',
    },
    {
      to: '/graph',
      label: 'Knowledge Graph',
      icon: Share2,
      description: 'Entity & relation visualizer',
    },
    {
      to: '/data',
      label: 'Data Management',
      icon: Database,
      description: 'Triple store & datasets',
    },
    {
      to: '/ontology',
      label: 'Ontology Overview',
      icon: FileCode2,
      description: 'Protégé model & classes',
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      description: 'Environment & endpoints',
    },
  ];

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between flex-shrink-0 select-none ${className}`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 focus:outline-none group">
            <div className="w-9 h-9 rounded-lg bg-edu-700 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-slate-900 tracking-tight">EduSmart</span>
                <span className="text-[10px] font-semibold bg-edu-50 text-edu-700 px-1.5 py-0.2 rounded border border-edu-200">
                  v0.1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">Semantic Web Platform</p>
            </div>
          </NavLink>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Modules
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-edu-50 text-edu-700 font-semibold border border-edu-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-edu-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <div className="truncate flex-1">
                        <div className="leading-tight">{item.label}</div>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="rounded-lg p-3 bg-white border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-800">Web Semantics</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              Phase 1
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
            Education & Training Knowledge Engineering project.
          </p>
          <a
            href="https://protege.stanford.edu"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-edu-600 hover:text-edu-700 hover:underline"
          >
            Protégé & HermiT Specs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
};
