import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  Database,
  Terminal,
  Share2,
  Layers,
  BookOpen,
  Award,
  Users,
  Building2,
  CheckCircle2,
  Globe,
  Code2,
  Cpu,
  LogIn,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useTranslation, useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();

  const branches = [
    {
      id: 'apprentissage',
      title: 'Apprentissage',
      titleAr: 'التعلم',
      titleEn: 'Learning',
      icon: BookOpen,
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      desc: 'Modalités d’apprentissage, activités pédagogiques formelles et évaluations.',
    },
    {
      id: 'competence',
      title: 'Compétence',
      titleAr: 'الكفاءات',
      titleEn: 'Competency',
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      desc: 'Compétences techniques, programmation, data science, langues et soft skills.',
      badge: 'CRUD + TALN',
    },
    {
      id: 'formation',
      title: 'Formation',
      titleAr: 'التكوين',
      titleEn: 'Training',
      icon: GraduationCap,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      desc: 'Diplômes, cours académiques, cursus d’ingénieur et prérequis pédagogiques.',
    },
    {
      id: 'personnes',
      title: 'Personnes',
      titleAr: 'الأشخاص',
      titleEn: 'Persons',
      icon: Users,
      color: 'from-purple-600 to-indigo-600',
      bgColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      desc: 'Enseignants, étudiants inscrits, tuteurs académiques et grades universitaires.',
      badge: 'CRUD + TALN',
    },
    {
      id: 'etablissement',
      title: 'Établissement',
      titleAr: 'المؤسسة',
      titleEn: 'Institution',
      icon: Building2,
      color: 'from-sky-600 to-blue-700',
      bgColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      desc: 'Universités, écoles d’ingénieurs de référence (ex: ESPRIT) et départements.',
    },
  ];

  const features = [
    {
      title: 'Triplestore Apache Jena Fuseki',
      desc: 'Stockage TDB2 haute performance hébergeant le graphe RDF avec support SPARQL 1.1 complet.',
      icon: Layers,
    },
    {
      title: 'Moteur TALN Déterministe',
      desc: 'Traduction de requêtes en langage naturel (français/anglais) vers W3C SPARQL sans LLM tiers.',
      icon: Terminal,
    },
    {
      title: 'Raisonnement Ontologique HermiT',
      desc: 'Validation formelle de cohérence logique et inférence de relations sous l’expressivité OWL 2 DL.',
      icon: Cpu,
    },
    {
      title: 'Opérations CRUD Sémantiques',
      desc: 'Gestion complète d’individus RDF (création, modification, suppression) pour Personnes et Compétences.',
      icon: Database,
    },
    {
      title: 'Graphe Interactif de Connaissances',
      desc: 'Exploration visuelle des entités, relations orientées et hiérarchies de sous-classes.',
      icon: Share2,
    },
    {
      title: 'Trilinguisme (FR, EN, AR) & RTL',
      desc: 'Interface accessible avec prise en charge native de la langue arabe (police Cairo) et mode sombre.',
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-edu-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-edu-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                EduSmart
              </span>
              <span className="block text-[10px] text-edu-700 dark:text-edu-400 font-semibold uppercase tracking-wider leading-none">
                Semantic Web
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#branches" className="hover:text-edu-600 dark:hover:text-edu-400 transition-colors">
              5 Branches
            </a>
            <a href="#features" className="hover:text-edu-600 dark:hover:text-edu-400 transition-colors">
              Fonctionnalités
            </a>
            <a href="#pipeline" className="hover:text-edu-600 dark:hover:text-edu-400 transition-colors">
              Pipeline SPARQL
            </a>
            <Link to={isAuthenticated ? "/ontology" : "/login"} className="hover:text-edu-600 dark:hover:text-edu-400 transition-colors">
              Ontologie OWL
            </Link>
          </nav>

          {/* Right Controls & Login Button */}
          <div className="flex items-center gap-3">
            <LanguageSelector />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-gradient-to-r from-edu-600 to-indigo-600 hover:from-edu-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard ({user?.name.split(' ')[0]})</span>
                </button>

                <button
                  onClick={logout}
                  title={t.auth.logout}
                  className="px-2.5 py-2 border border-slate-300 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.auth.logout}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 bg-gradient-to-r from-edu-600 to-indigo-600 hover:from-edu-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-edu-600/20 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.home.loginBtn}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        {/* Glow Circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-edu-500/15 via-indigo-500/15 to-purple-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-edu-50 dark:bg-edu-950/60 border border-edu-200 dark:border-edu-800 rounded-full text-xs font-semibold text-edu-700 dark:text-edu-300 mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.home.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            {t.home.heroTitle}{' '}
            <span className="bg-gradient-to-r from-edu-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t.home.heroHighlight}
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t.home.heroSubtitle}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-edu-600 to-indigo-600 hover:from-edu-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-edu-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t.home.dashboardBtn}</span>
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-edu-600 to-indigo-600 hover:from-edu-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-edu-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.home.loginBtn}</span>
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            )}

            <Link
              to={isAuthenticated ? "/ontology" : "/login"}
              className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-edu-500 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Code2 className="w-4 h-4 text-edu-600" />
              <span>{t.home.exploreBtn}</span>
            </Link>
          </div>

          {/* Mini Live Status Pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Apache Jena Fuseki TDB2
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Raisonnement HermiT OWL 2 DL
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              spaCy NLP FR / EN
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              3 Langues & RTL
            </span>
          </div>
        </div>
      </section>

      {/* 3. 5 Ontological Branches Section */}
      <section id="branches" className="py-16 px-6 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.home.branchesTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {t.home.branchesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {branches.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card hover:border-edu-300 dark:hover:border-edu-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${b.bgColor} flex items-center justify-center font-bold`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {b.badge && (
                        <span className="text-[10px] bg-edu-50 dark:bg-edu-950 text-edu-700 dark:text-edu-300 font-bold px-2 py-0.5 rounded-full border border-edu-200 dark:border-edu-800">
                          {b.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isRtl ? b.titleAr : b.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {b.desc}
                    </p>
                  </div>

                  <Link
                    to={isAuthenticated ? "/dashboard" : "/login"}
                    className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-edu-600 dark:text-edu-400 hover:underline flex items-center gap-1"
                  >
                    <span>{isAuthenticated ? 'Consulter' : t.home.loginBtn}</span>
                    <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Live Pipeline Section */}
      <section id="pipeline" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.home.sparqlPreviewTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Pipeline de découverte sémantique associant le langage naturel au triplestore SPARQL 1.1.
            </p>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-elevated">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-mono text-slate-400 ms-2">SPARQL 1.1 Query — EduSmart Jena Triplestore</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-edu-400 px-2 py-0.5 rounded font-mono">
                Dataset: /edusmart
              </span>
            </div>

            <pre className="font-mono text-xs overflow-x-auto leading-relaxed text-slate-300">
              <span className="text-purple-400">PREFIX</span> <span className="text-cyan-300">edu:</span> &lt;http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#&gt;{'\n'}
              <span className="text-purple-400">PREFIX</span> <span className="text-cyan-300">rdfs:</span> &lt;http://www.w3.org/2000/01/rdf-schema#&gt;{'\n\n'}
              <span className="text-blue-400">SELECT DISTINCT</span> <span className="text-yellow-300">?personne ?competence ?niveau</span>{'\n'}
              <span className="text-blue-400">WHERE</span> &#123;{'\n'}
              {'  '}<span className="text-yellow-300">?personne</span> <span className="text-pink-400">edu:aAcquis</span> <span className="text-yellow-300">?competence</span> .{'\n'}
              {'  '}<span className="text-yellow-300">?competence</span> <span className="text-pink-400">edu:niveau</span> <span className="text-yellow-300">?niveau</span> .{'\n'}
              &#125; <span className="text-blue-400">LIMIT</span> <span className="text-emerald-400">10</span>
            </pre>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Testez vos requêtes et inférences en direct :</span>
              <Link
                to={isAuthenticated ? "/sparql" : "/login"}
                className="px-3 py-1.5 bg-edu-600 hover:bg-edu-700 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                {isAuthenticated ? 'Ouvrir l’Explorateur SPARQL' : t.home.loginBtn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid Section */}
      <section id="features" className="py-16 px-6 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.home.featuresTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {t.home.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-edu-50 dark:bg-edu-950/60 text-edu-700 dark:text-edu-300 flex items-center justify-center font-bold mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="py-10 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-edu-700 text-white flex items-center justify-center font-bold text-[10px]">
              ES
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              EduSmart Academic Ontology Platform
            </span>
            <span className="text-slate-400">&copy; 2026</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            {isAuthenticated ? (
              <Link to="/dashboard" className="hover:text-edu-600 transition-colors">
                Tableau de Bord
              </Link>
            ) : (
              <Link to="/login" className="hover:text-edu-600 transition-colors font-bold text-edu-600 dark:text-edu-400">
                {t.home.loginBtn}
              </Link>
            )}
            <Link to={isAuthenticated ? "/ontology" : "/login"} className="hover:text-edu-600 transition-colors">
              Ontologie
            </Link>
            <Link to={isAuthenticated ? "/sparql" : "/login"} className="hover:text-edu-600 transition-colors">
              SPARQL
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
