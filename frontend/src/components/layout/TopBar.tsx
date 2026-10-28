import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  RefreshCw,
  Server,
  Layers,
  LogOut,
  LogIn,
} from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';
import { LanguageSelector } from '../ui/LanguageSelector';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [globalQuery, setGlobalQuery] = useState('');

  const currentRoute = t.topbar.routes[location.pathname] || {
    title: 'EduSmart',
    subtitle: t.nav.platform,
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
          <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder={t.topbar.searchPlaceholder}
            aria-label="Global natural language and entity search"
            className={`w-full py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-500 focus:bg-white transition-all ${
              isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
            }`}
          />
        </form>

        {/* Live Status: FastAPI Backend */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          title={
            isLoading
              ? t.common.loading
              : isError
              ? 'FastAPI Backend offline'
              : `FastAPI online (v${health?.version})`
          }
        >
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium hidden sm:inline">Backend:</span>
          {isLoading ? (
            <span className="text-slate-400 text-[11px]">{t.common.loading}</span>
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
          title={isFusekiOnline ? t.topbar.fusekiOnline : t.topbar.fusekiStandby}
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">Fuseki:</span>
          {isFusekiOnline ? (
            <StatusDot status="online" label="Online" showPing={true} />
          ) : (
            <StatusDot status="standby" label="Standby" />
          )}
        </div>

        {/* Language & Accessibility Selector */}
        <LanguageSelector />

        {/* Notification Icon */}
        <button
          type="button"
          disabled
          aria-label="Notifications"
          title="Notifications placeholder"
          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 cursor-not-allowed bg-slate-50"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Profile Avatar / Auth Status */}
        {isAuthenticated && user ? (
          <div
            className={`flex items-center gap-2 border-slate-200 select-none ${
              isRtl ? 'pr-2 border-r' : 'pl-2 border-l'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-edu-100 dark:bg-edu-950 text-edu-700 dark:text-edu-300 border border-edu-200 dark:border-edu-800 flex items-center justify-center font-bold text-xs">
              {user.initials}
            </div>
            <div className="hidden xl:block text-start">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {user.role}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title={t.auth.logout}
              aria-label={t.auth.logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ms-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-edu-600 hover:bg-edu-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t.auth.signInBtn}</span>
          </button>
        )}
      </div>
    </header>
  );
};
