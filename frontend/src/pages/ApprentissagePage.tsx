import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Award,
  Search,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Code2,
  RefreshCw,
  X,
  AlertCircle,
  Copy,
  CheckCircle2,
  Calendar,
  Monitor,
  Check,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import type {
  ApprentissageItem,
  ApprentissageClassItem,
  ApprentissageCreate,
} from '../types';

export const ApprentissagePage: React.FC = () => {
  const { t } = useTranslation();

  // Data states
  const [items, setItems] = useState<ApprentissageItem[]>([]);
  const [classes, setClasses] = useState<ApprentissageClassItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchNom, setSearchNom] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Tous');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedModalite, setSelectedModalite] = useState<string>('Tous');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Text chat / TALN command state
  const [chatCommand, setChatCommand] = useState<string>('');
  const [isChatExecuting, setIsChatExecuting] = useState<boolean>(false);
  const [chatFeedback, setChatFeedback] = useState<{
    success: boolean;
    message: string;
    sparql?: string | null;
  } | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ApprentissageItem | null>(null);

  // Form states
  const [formLabel, setFormLabel] = useState<string>('');
  const [formId, setFormId] = useState<string>('');
  const [formClass, setFormClass] = useState<string>('Examen_Final');
  const [formCategory, setFormCategory] = useState<string>('Évaluation');
  const [formModalite, setFormModalite] = useState<string>('Présentiel');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formScore, setFormScore] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formStatut, setFormStatut] = useState<string>('Planifié');
  const [formCompetence, setFormCompetence] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Inspector / SPARQL Drawer
  const [activeSparql, setActiveSparql] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [itemList, clsList] = await Promise.all([
        api.getApprentissages({
          name: searchNom || undefined,
          class_name: selectedClass !== 'Tous' ? selectedClass : undefined,
          category: selectedCategory !== 'Tous' ? selectedCategory : undefined,
          modalite: selectedModalite !== 'Tous' ? selectedModalite : undefined,
        }),
        api.getApprentissageClasses(),
      ]);
      setItems(itemList);
      setClasses(clsList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchNom, selectedClass, selectedCategory, selectedModalite]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const evaluations = items.filter((i) => i.category === 'Évaluation').length;
    const activites = items.filter((i) => i.category === 'Activité').length;
    const parcours = items.filter((i) => i.category === 'Parcours').length;
    return { total, evaluations, activites, parcours };
  }, [items]);

  // Handle TALN Command
  const handleExecuteChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatCommand.trim()) return;

    setIsChatExecuting(true);
    setChatFeedback(null);

    try {
      const res = await api.executeApprentissageChat(chatCommand);
      setChatFeedback({
        success: res.success,
        message: res.message,
        sparql: res.sparql,
      });
      if (res.success) {
        setChatCommand('');
        await fetchData();
      }
    } catch (err: unknown) {
      setChatFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Erreur lors du traitement de la commande.',
      });
    } finally {
      setIsChatExecuting(false);
    }
  };

  // Quick prompt helper
  const handleQuickPrompt = (prompt: string) => {
    setChatCommand(prompt);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormLabel('');
    setFormId('');
    setFormClass('Examen_Final');
    setFormCategory('Évaluation');
    setFormModalite('Présentiel');
    setFormDescription('');
    setFormScore('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatut('Planifié');
    setFormCompetence('');
    setIsCreateModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: ApprentissageCreate = {
        id: formId.trim() || undefined,
        label: formLabel.trim(),
        class_name: formClass,
        category: formCategory,
        modalite: formModalite,
        description: formDescription.trim() || undefined,
        score: formScore ? parseFloat(formScore) : undefined,
        date_evaluation: formDate || undefined,
        statut: formStatut,
        evalue_competence: formCompetence.trim() || undefined,
      };

      await api.createApprentissage(payload);
      setIsCreateModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: ApprentissageItem) => {
    setSelectedItem(item);
    setFormLabel(item.label);
    setFormId(item.id);
    setFormClass(item.class_name);
    setFormCategory(item.category || 'Activité');
    setFormModalite(item.modalite || 'Présentiel');
    setFormDescription(item.description || '');
    setFormScore(item.score !== null && item.score !== undefined ? String(item.score) : '');
    setFormDate(item.date_evaluation || '');
    setFormStatut(item.statut || 'Planifié');
    setFormCompetence(item.evalue_competence || '');
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !formLabel.trim()) return;

    setIsSubmitting(true);
    try {
      await api.updateApprentissage(selectedItem.id, {
        label: formLabel.trim(),
        class_name: formClass,
        category: formCategory,
        modalite: formModalite,
        description: formDescription.trim() || undefined,
        score: formScore ? parseFloat(formScore) : undefined,
        date_evaluation: formDate || undefined,
        statut: formStatut,
        evalue_competence: formCompetence.trim() || undefined,
      });

      setIsEditModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item: ApprentissageItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await api.deleteApprentissage(selectedItem.id);
      setIsDeleteModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy SPARQL snippet
  const handleCopySparql = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for Category Badge Styling
  const getCategoryBadgeClass = (category?: string | null) => {
    switch (category) {
      case 'Évaluation':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Activité':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Parcours':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
  };

  // Helper for Modality Badge Styling
  const getModaliteBadgeClass = (modalite?: string | null) => {
    switch (modalite) {
      case 'En ligne':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Hybride':
        return 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-edu-50 dark:bg-edu-950 text-edu-700 dark:text-edu-300 border border-edu-200 dark:border-edu-800">
              {t.apprentissage.pageBadge}
            </span>
            <span className="text-slate-400 text-xs">• OWL 2 DL SPARQL 1.1</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-edu-600 dark:text-edu-400" />
            <span>{t.apprentissage.pageTitle}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.apprentissage.pageSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-edu-600 to-indigo-600 hover:from-edu-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-edu-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.apprentissage.newApprentissage}</span>
          </button>
        </div>
      </div>

      {/* 2. Statistical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between border-slate-200/90 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.apprentissage.totalCount}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.total}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-edu-50 dark:bg-edu-950 text-edu-600 dark:text-edu-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200/90 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.apprentissage.evaluationsCount}
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.evaluations}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200/90 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.apprentissage.activitesCount}
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {stats.activites}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Monitor className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200/90 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.apprentissage.parcoursCount}
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.parcours}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* 3. TALN / NLP Command Bar */}
      <Card className="p-5 border-edu-200/80 dark:border-edu-900/60 bg-gradient-to-r from-edu-50/50 via-white to-indigo-50/30 dark:from-edu-950/20 dark:via-slate-900 dark:to-indigo-950/20 shadow-subtle">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-edu-600 dark:text-edu-400" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {t.apprentissage.talnTitle}
          </h2>
          <span className="text-[10px] bg-edu-100 dark:bg-edu-950 text-edu-700 dark:text-edu-300 font-bold px-2 py-0.5 rounded-full">
            {t.apprentissage.talnBadge}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {t.apprentissage.talnSubtitle}
        </p>

        <form onSubmit={handleExecuteChat} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={chatCommand}
              onChange={(e) => setChatCommand(e.target.value)}
              placeholder={t.apprentissage.talnPlaceholder}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-500 shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={isChatExecuting || !chatCommand.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-edu-600 hover:bg-edu-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {isChatExecuting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t.apprentissage.executing}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.apprentissage.execute}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Example Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {t.apprentissage.examplesLabel}
          </span>
          <button
            type="button"
            onClick={() => handleQuickPrompt("créer un examen nommé Examen Final Web Sémantique avec score 18.5")}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            "créer un examen nommé Examen Final Web Sémantique avec score 18.5"
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("modifier le score de Examen Final Web Sémantique à 10")}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            "modifier le score de Examen Final Web Sémantique à 10"
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("créer un tp nommé TP Guidé Protégé & HermiT")}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            "créer un tp nommé TP Guidé Protégé & HermiT"
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("lister les évaluations")}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            "lister les évaluations"
          </button>
        </div>

        {/* TALN Result Feedback */}
        {chatFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
              chatFeedback.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {chatFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                )}
                <span className="font-semibold">{chatFeedback.message}</span>
              </div>
              <button
                onClick={() => setChatFeedback(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {chatFeedback.sparql && (
              <div className="mt-1">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-1 flex items-center justify-between">
                  <span>SPARQL 1.1 Exécuté :</span>
                  <button
                    onClick={() => handleCopySparql(chatFeedback.sparql || '')}
                    className="hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
                <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {chatFeedback.sparql}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4. Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-subtle flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search text */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchNom}
              onChange={(e) => setSearchNom(e.target.value)}
              placeholder="Rechercher par titre..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-edu-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-edu-500 cursor-pointer"
          >
            <option value="Tous">{t.apprentissage.allCategories}</option>
            <option value="Évaluation">Évaluations & Examens</option>
            <option value="Activité">Activités & Cours</option>
            <option value="Parcours">Parcours Académiques</option>
            <option value="Type_Apprentissage">Types d’Apprentissage</option>
          </select>

          {/* Modalité Filter */}
          <select
            value={selectedModalite}
            onChange={(e) => setSelectedModalite(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-edu-500 cursor-pointer"
          >
            <option value="Tous">{t.apprentissage.allModalites}</option>
            <option value="Présentiel">Présentiel</option>
            <option value="En ligne">En ligne</option>
            <option value="Hybride">Hybride</option>
          </select>

          {/* Subclass Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-edu-500 cursor-pointer max-w-[180px]"
          >
            <option value="Tous">{t.apprentissage.allSubclasses}</option>
            {classes.map((c) => (
              <option key={c.class_name} value={c.class_name}>
                {c.label || c.class_name.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 self-end lg:self-center border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-edu-600 dark:text-edu-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.apprentissage.viewGrid}
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-edu-600 dark:text-edu-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.apprentissage.viewTable}
          </button>
        </div>
      </div>

      {/* 5. Main Content (Grid or Table) */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-edu-600 mb-3" />
          <span className="text-xs font-medium">Chargement des éléments d'apprentissage...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.apprentissage.emptyTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {t.apprentissage.emptyDesc}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-edu-600 hover:bg-edu-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.apprentissage.newApprentissage}</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isEvaluation = item.category === 'Évaluation';
            const isParcours = item.category === 'Parcours';
            const Icon = isEvaluation ? Award : isParcours ? GraduationCap : BookOpen;

            return (
              <Card
                key={item.id}
                className="p-5 border-slate-200/90 dark:border-slate-800 hover:border-edu-300 dark:hover:border-edu-700 transition-all flex flex-col justify-between group shadow-subtle hover:shadow-card"
              >
                <div>
                  {/* Card Top: Badges & Category */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {item.category || 'Activité'}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getModaliteBadgeClass(
                        item.modalite
                      )}`}
                    >
                      {item.modalite || 'Présentiel'}
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-edu-50 dark:bg-edu-950 text-edu-600 dark:text-edu-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-edu-600 dark:group-hover:text-edu-400 transition-colors">
                        {item.label}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        owl:{item.class_name}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Key Metadata Pills */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                    {item.score !== null && item.score !== undefined && (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 text-[11px]">
                        <Award className="w-3 h-3" />
                        <span>{item.score} / 20</span>
                      </span>
                    )}

                    {item.date_evaluation && (
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.date_evaluation}</span>
                      </span>
                    )}

                    {item.statut && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{item.statut}</span>
                      </span>
                    )}
                  </div>

                  {/* Competence Target */}
                  {item.competence_label && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="text-slate-400">Évalue :</span>
                      <span className="font-semibold text-edu-600 dark:text-edu-400">
                        {item.competence_label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() =>
                      setActiveSparql(`PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>
SELECT ?p ?o WHERE {
  edu:${item.id} ?p ?o .
}`)
                    }
                    className="text-slate-400 hover:text-edu-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>SPARQL</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-edu-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Titre / Activité</th>
                  <th className="py-3 px-4">Classe Ontologique</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Modalité</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      owl:{item.class_name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.category || 'Activité'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getModaliteBadgeClass(
                          item.modalite
                        )}`}
                      >
                        {item.modalite || 'Présentiel'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                      {item.score !== null && item.score !== undefined ? `${item.score} / 20` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.date_evaluation || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{item.statut || 'Planifié'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-slate-400 hover:text-edu-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Create / Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-elevated w-full max-w-lg p-6 relative">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-edu-600" />
              <span>
                {isCreateModalOpen
                  ? t.apprentissage.modalCreateTitle
                  : t.apprentissage.modalEditTitle}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              {t.apprentissage.modalCreateSubtitle}
            </p>

            <form
              onSubmit={isCreateModalOpen ? handleCreateSubmit : handleEditSubmit}
              className="space-y-4"
            >
              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.apprentissage.labelField}
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Ex: Examen Final Web Sémantique"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500"
                />
              </div>

              {/* Class & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.apprentissage.subclassField}
                  </label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500 cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.class_name} value={c.class_name}>
                        {c.label || c.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.apprentissage.categoryField}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500 cursor-pointer"
                  >
                    <option value="Évaluation">Évaluation</option>
                    <option value="Activité">Activité</option>
                    <option value="Parcours">Parcours</option>
                    <option value="Type_Apprentissage">Type d’Apprentissage</option>
                  </select>
                </div>
              </div>

              {/* Modality & Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.apprentissage.modaliteField}
                  </label>
                  <select
                    value={formModalite}
                    onChange={(e) => setFormModalite(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500 cursor-pointer"
                  >
                    <option value="Présentiel">Présentiel</option>
                    <option value="En ligne">En ligne</option>
                    <option value="Hybride">Hybride</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.apprentissage.scoreField}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                    placeholder="Ex: 16.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500"
                  />
                </div>
              </div>

              {/* Date & Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.apprentissage.dateField}
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.apprentissage.statutField}
                  </label>
                  <select
                    value={formStatut}
                    onChange={(e) => setFormStatut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500 cursor-pointer"
                  >
                    <option value="Planifié">Planifié</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Validé">Validé</option>
                  </select>
                </div>
              </div>

              {/* Competence Target */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.apprentissage.competenceField}
                </label>
                <input
                  type="text"
                  value={formCompetence}
                  onChange={(e) => setFormCompetence(e.target.value)}
                  placeholder="Ex: Programmation_Java ou Web_Semantique"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.apprentissage.descField}
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Détails des objectifs pédagogiques..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-edu-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-edu-600 hover:bg-edu-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-elevated w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.apprentissage.modalDeleteTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
              {t.apprentissage.modalDeleteDesc} (<strong>{selectedItem.label}</strong>)
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SPARQL Inspector Modal */}
      {activeSparql && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-elevated w-full max-w-xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-edu-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  SPARQL 1.1 Inspector
                </span>
              </div>
              <button
                onClick={() => setActiveSparql(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {activeSparql}
            </pre>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Prêt pour exécution dans Apache Jena Fuseki
              </span>
              <button
                onClick={() => handleCopySparql(activeSparql)}
                className="px-3 py-1.5 bg-edu-600 hover:bg-edu-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copié !' : 'Copier la requête'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprentissagePage;
