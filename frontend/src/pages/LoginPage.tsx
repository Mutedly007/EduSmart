import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from '../components/ui/LanguageSelector';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('admin@edusmart.tn');
  const [password, setPassword] = useState('edusmart2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate authentication latency for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 600));
      await login(email);
      navigate('/dashboard');
    } catch {
      setError('Identifiants incorrects.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoRole: string, demoName: string) => {
    setEmail(demoEmail);
    setPassword('demo2026');
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 400));
    await login(demoEmail, demoRole, demoName);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-between relative overflow-hidden transition-colors">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-edu-500/10 dark:bg-edu-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language Selector and Back to Home */}
      <header className="px-6 py-4 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-edu-600 dark:hover:text-edu-400 transition-colors"
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          <span>{t.auth.backToHome}</span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSelector />
        </div>
      </header>

      {/* Main Login Form Container */}
      <div className="w-full max-w-md mx-auto px-4 py-8 z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-elevated p-8 relative">
          {/* Logo & Platform Name */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-edu-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-edu-600/20">
                <GraduationCap className="w-6 h-6" />
              </div>
            </Link>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.auth.loginTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {t.auth.loginSubtitle}
            </p>
          </div>

          {/* Quick 1-Click Demo Profiles */}
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
              {t.auth.quickDemoTitle}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('admin@edusmart.tn', 'Administrateur', 'Administrateur Ontologue')
                }
                className="py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-edu-500 text-slate-700 dark:text-slate-200 hover:text-edu-600 rounded-lg text-[10px] font-bold transition-all shadow-2xs flex flex-col items-center gap-0.5 text-center"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-edu-600" />
                <span>{t.auth.adminRole}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('prof@esprit.tn', 'Enseignant Chercheur', 'Dr. Sami Trabelsi')
                }
                className="py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-edu-500 text-slate-700 dark:text-slate-200 hover:text-edu-600 rounded-lg text-[10px] font-bold transition-all shadow-2xs flex flex-col items-center gap-0.5 text-center"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.auth.profRole}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('etudiant@esprit.tn', 'Étudiant', 'Yassine Ben Ali')
                }
                className="py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-edu-500 text-slate-700 dark:text-slate-200 hover:text-edu-600 rounded-lg text-[10px] font-bold transition-all shadow-2xs flex flex-col items-center gap-0.5 text-center"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.auth.studentRole}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail
                  className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                    isRtl ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@edusmart.tn"
                  className={`w-full py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-600 focus:bg-white transition-all ${
                    isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.auth.passwordLabel}
              </label>
              <div className="relative">
                <Lock
                  className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                    isRtl ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-600 focus:bg-white transition-all ${
                    isRtl ? 'pr-9 pl-9' : 'pl-9 pr-9'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${
                    isRtl ? 'left-3' : 'right-3'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-edu-600 focus:ring-edu-500"
                />
                <span>{t.auth.rememberMe}</span>
              </label>

              <span className="text-[11px] text-edu-600 dark:text-edu-400 font-medium cursor-pointer hover:underline">
                Mot de passe oublié ?
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-edu-600 to-indigo-600 hover:from-edu-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-edu-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>{t.auth.signingIn}</span>
                </>
              ) : (
                <>
                  <span>{t.auth.signInBtn}</span>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 z-10">
        EduSmart Semantic Web Platform &copy; 2026 — ESPRIT
      </footer>
    </div>
  );
};
