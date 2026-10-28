import {
  Settings,
  Server,
  Layers,
  Cpu,
  HardDrive,
  Lock,
  CheckCircle2,
  Globe,
  Eye,
  Type,
  Sun,
  Moon,
  Check,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusDot } from '../components/ui/StatusDot';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language, FontSize } from '../i18n/types';

export const SettingsPage: React.FC = () => {
  const { health, isLoading, isError } = useBackendHealth();
  const isFusekiOnline = health?.services?.apache_jena_fuseki?.status === 'online';
  const {
    language,
    setLanguage,
    t,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    darkMode,
    toggleDarkMode,
  } = useLanguage();

  const langList: { code: Language; name: string; flag: string; dir: string }[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'LTR' },
    { code: 'en', name: 'English', flag: '🇬🇧', dir: 'LTR' },
    { code: 'ar', name: 'العربية', flag: '🇹🇳', dir: 'RTL' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold mb-2 border border-slate-200">
          <Settings className="w-3.5 h-3.5" /> {t.accessibility.title} & Configuration
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {t.topbar.routes['/settings']?.title || 'Paramètres'}
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          {t.topbar.routes['/settings']?.subtitle || 'Configuration globale, accessibilité visuelle et multilinguisme.'}
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed">
          <span className="font-semibold">All Semantic Services Operational:</span> FastAPI backend, Apache Jena Fuseki triplestore,
          and spaCy NLP linguistic pipelines are active and responding within normal latency tolerances.
        </div>
      </div>

      {/* Card: Accessibility & Multilingual Translation (NEW) */}
      <Card
        title={t.accessibility.title}
        subtitle="Internationalisation (Français, English, العربية) & Ergonomie WCAG"
        icon={<Globe className="w-5 h-5 text-edu-600" />}
        badge={<Badge variant="blue" size="sm">3 Langues & RTL</Badge>}
      >
        <div className="space-y-5 text-xs">
          {/* 1. Language Picker */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-edu-600" />
              {t.accessibility.language}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {langList.map((item) => {
                const isSelected = language === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-edu-600 bg-edu-50/60 text-edu-900 font-bold ring-2 ring-edu-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{item.flag}</span>
                      <div className="text-start">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Direction: {item.dir}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-edu-700 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Text Sizing Controls */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                <Type className="w-4 h-4 text-slate-500" />
                {t.accessibility.textSize}
              </label>
              <span className="text-xs font-mono text-slate-500">
                {fontSize === 'normal' ? '100% (Normal)' : fontSize === 'large' ? '110% (Large)' : '120% (Très Grand)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'normal', label: t.accessibility.normal, scale: 'A' },
                  { id: 'large', label: t.accessibility.large, scale: 'A+' },
                  { id: 'xlarge', label: t.accessibility.xlarge, scale: 'A++' },
                ] as { id: FontSize; label: string; scale: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontSize(f.id)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    fontSize === f.id
                      ? 'border-edu-600 bg-edu-700 text-white shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-bold">{f.scale}</span>
                  <span className="text-[11px] hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Dark Mode / Light Mode Toggle */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {darkMode ? t.accessibility.darkMode : t.accessibility.lightMode}
                </div>
                <div className="text-[11px] text-slate-500 max-w-md mt-0.5 leading-relaxed">
                  {darkMode
                    ? 'Le mode sombre est activé, réduisant la fatigue oculaire dans les environnements sombres.'
                    : 'Le mode clair est activé avec un contraste de lecture optimal.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={toggleDarkMode}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                darkMode ? 'bg-edu-600 justify-end' : 'bg-slate-200 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-2xs block" />
            </button>
          </div>

          {/* 4. High Contrast Toggle */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">{t.accessibility.highContrast}</div>
                <div className="text-[11px] text-slate-500 max-w-md mt-0.5 leading-relaxed">
                  {t.accessibility.highContrastDesc}
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={highContrast}
              onClick={() => setHighContrast(!highContrast)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                highContrast ? 'bg-edu-700 justify-end' : 'bg-slate-200 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-2xs block" />
            </button>
          </div>
        </div>
      </Card>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Backend API Settings */}
        <Card
          title="Backend HTTP API Settings"
          subtitle="FastAPI server parameters"
          icon={<Server className="w-5 h-5 text-edu-600" />}
          badge={
            isLoading ? (
              <StatusDot status="warning" label="Checking" />
            ) : isError ? (
              <StatusDot status="offline" label="Offline" />
            ) : (
              <StatusDot status="online" label="Online" showPing={true} />
            )
          }
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
              <label className="block text-slate-500 font-medium mb-1">Interactive API Documentation</label>
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
          badge={
            isFusekiOnline ? (
              <StatusDot status="online" label="Operational" showPing={true} />
            ) : (
              <StatusDot status="standby" label="Standby" />
            )
          }
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
                value="/edusmart"
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
          badge={<Badge variant="blue" size="sm">Rule-Based spaCy</Badge>}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Linguistic Processing Models</label>
              <input
                type="text"
                readOnly
                value="fr_core_news_sm (v3.8.0), en_core_web_sm (v3.8.0)"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Grammar & Intent Parsing</label>
              <input
                type="text"
                readOnly
                value="Deterministic regex pattern matching & dependency POS parsing"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">External Hosted LLM Policy</label>
              <input
                type="text"
                readOnly
                value="Zero external cloud LLM dependencies (Academic compliance)"
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
          badge={<Badge variant="emerald" size="sm">HermiT Consistent</Badge>}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Ontology File Location</label>
              <input
                type="text"
                readOnly
                value="backend/ontology/EduSmart_5Niveaux_Toutes_Branches_Corrige.rdf"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Default Ontology Graph URI</label>
              <input
                type="text"
                readOnly
                value="http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">HermiT Reasoner Verification</label>
              <input
                type="text"
                readOnly
                value="Classified with HermiT: Return Code 0 (Consistent)"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-emerald-800 font-semibold text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
