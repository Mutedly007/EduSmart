import React, { useState, useEffect } from 'react';
import {
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
  Layers,
  BookOpen,
  UserCheck,
  Languages,
  CheckCircle2,
  Cpu,
  Share2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { CompetenceItem, CompetenceClassItem } from '../types';

export const CompetencesPage: React.FC = () => {
  // Data states
  const [competences, setCompetences] = useState<CompetenceItem[]>([]);
  const [classes, setClasses] = useState<CompetenceClassItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchNom, setSearchNom] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Tous');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedNiveau, setSelectedNiveau] = useState<string>('Tous');
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
  const [selectedCompetence, setSelectedCompetence] = useState<CompetenceItem | null>(null);

  // Form states
  const [formLabel, setFormLabel] = useState<string>('');
  const [formId, setFormId] = useState<string>('');
  const [formClass, setFormClass] = useState<string>('Programmation');
  const [formNiveau, setFormNiveau] = useState<string>('Intermédiaire');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formLangue, setFormLangue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Inspector / SPARQL Drawer
  const [activeSparql, setActiveSparql] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [items, clsList] = await Promise.all([
        api.getCompetences({
          name: searchNom || undefined,
          class_name: selectedClass !== 'Tous' ? selectedClass : undefined,
          niveau: selectedNiveau !== 'Tous' ? selectedNiveau : undefined,
          category: selectedCategory !== 'Tous' ? selectedCategory : undefined,
        }),
        api.getCompetenceClasses(),
      ]);
      setCompetences(items);
      setClasses(clsList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedNiveau]);

  // Filter handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleResetFilters = () => {
    setSearchNom('');
    setSelectedClass('Tous');
    setSelectedCategory('Tous');
    setSelectedNiveau('Tous');
    api.getCompetences().then((items) => setCompetences(items));
  };

  // Chat / Natural Language TALN command handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatCommand.trim()) return;

    setIsChatExecuting(true);
    setChatFeedback(null);

    try {
      const res = await api.executeCompetenceChat(chatCommand);
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
        message: err instanceof Error ? err.message : 'Erreur lors de l’exécution de la commande.',
      });
    } finally {
      setIsChatExecuting(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormLabel('');
    setFormId('');
    setFormClass(classes[0]?.class_name || 'Programmation');
    setFormNiveau('Intermédiaire');
    setFormDescription('');
    setFormLangue('');
    setIsCreateModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createCompetence({
        label: formLabel.trim(),
        id: formId.trim() || undefined,
        class_name: formClass,
        niveau: formNiveau,
        description: formDescription.trim() || undefined,
        langue: formLangue.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      await fetchData();
      setChatFeedback({
        success: true,
        message: res.message,
        sparql: res.sparql,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Échec de la création de la compétence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (comp: CompetenceItem) => {
    setSelectedCompetence(comp);
    setFormLabel(comp.label);
    setFormClass(comp.class_name);
    setFormNiveau(comp.niveau || 'Intermédiaire');
    setFormDescription(comp.description || '');
    setFormLangue(comp.langue || '');
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompetence) return;

    setIsSubmitting(true);
    try {
      const res = await api.updateCompetence(selectedCompetence.id, {
        label: formLabel.trim(),
        class_name: formClass,
        niveau: formNiveau,
        description: formDescription.trim() || undefined,
        langue: formLangue.trim() || undefined,
      });

      setIsEditModalOpen(false);
      await fetchData();
      setChatFeedback({
        success: true,
        message: res.message,
        sparql: res.sparql,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Échec de la modification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (comp: CompetenceItem) => {
    setSelectedCompetence(comp);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!selectedCompetence) return;

    setIsSubmitting(true);
    try {
      const res = await api.deleteCompetence(selectedCompetence.id);
      setIsDeleteModalOpen(false);
      await fetchData();
      setChatFeedback({
        success: true,
        message: res.message,
        sparql: res.sparql,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Échec de la suppression.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy SPARQL snippet
  const handleCopySparql = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper styles for Niveau
  const getNiveauBadge = (niveau?: string | null) => {
    const niv = (niveau || 'Intermédiaire').toLowerCase();
    if (niv.includes('deb') || niv.includes('déb')) {
      return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">Débutant</span>;
    }
    if (niv.includes('avan')) {
      return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Avancé</span>;
    }
    if (niv.includes('exp')) {
      return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Expert</span>;
    }
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Intermédiaire</span>;
  };

  // Helper styles for Category
  const getCategoryBadge = (category?: string | null) => {
    const cat = category || 'Technique';
    if (cat === 'Linguistique') {
      return <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1"><Languages className="w-3 h-3" /> Linguistique</span>;
    }
    if (cat === 'Transversale') {
      return <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1"><Share2 className="w-3 h-3" /> Transversale</span>;
    }
    return <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><Cpu className="w-3 h-3" /> Technique</span>;
  };

  // Stats calculation
  const totalCount = competences.length;
  const countTechnique = competences.filter((c) => c.category === 'Technique').length;
  const countTransversale = competences.filter((c) => c.category === 'Transversale').length;
  const countLinguistique = competences.filter((c) => c.category === 'Linguistique').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-edu-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestion des Compétences
              </h1>
              <Badge variant="blue">Branche Compétence</Badge>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-medium">
                W3C SPARQL 1.1
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Architecture ontologique à 5 niveaux : Compétences Techniques, Transversales et Linguistiques avec relations sémantiques.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-edu-700 hover:bg-edu-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all shadow-edu-700/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Compétence
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3 border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-edu-50 text-edu-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-none">{totalCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Total Compétences</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-blue-200 bg-blue-50/20">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900 leading-none">{countTechnique}</div>
            <div className="text-xs text-blue-600 font-medium mt-1">Techniques</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-purple-200 bg-purple-50/20">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-900 leading-none">{countTransversale}</div>
            <div className="text-xs text-purple-600 font-medium mt-1">Transversales</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-teal-200 bg-teal-50/20">
          <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-teal-900 leading-none">{countLinguistique}</div>
            <div className="text-xs text-teal-600 font-medium mt-1">Linguistiques</div>
          </div>
        </Card>
      </div>

      {/* 3. Natural Language TALN / NLP Command Assistant */}
      <Card className="p-5 border-edu-200 bg-gradient-to-r from-edu-50/40 via-white to-blue-50/30">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-edu-700 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-800">
            Assistant TALN / NLP — Commandes en langage naturel
          </h2>
          <span className="text-[10px] bg-edu-100 text-edu-800 font-semibold px-2 py-0.5 rounded-full">
            spaCy + Règles Sémantiques
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Saisissez une instruction en français pour manipuler directement le triplestore (création, modification, suppression ou recherche).
        </p>

        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={chatCommand}
              onChange={(e) => setChatCommand(e.target.value)}
              placeholder="Ex: Créer une compétence nommée Deep Learning de niveau Avancé"
              className="w-full text-xs py-2.5 pl-3 pr-8 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-edu-600 focus:border-transparent bg-white shadow-inner font-mono text-slate-800"
            />
            {chatCommand && (
              <button
                type="button"
                onClick={() => setChatCommand('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isChatExecuting || !chatCommand.trim()}
            className="px-4 py-2 bg-edu-700 hover:bg-edu-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isChatExecuting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Exécution...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Exécuter
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] text-slate-400 font-medium">Exemples :</span>
          {[
            'Créer compétence Cloud Computing niveau Avancé',
            'Lister les compétences techniques',
            'Modifier le niveau de Algorithmique à Expert',
            'Ajouter compétence Anglais des Affaires de type Anglais_Technique',
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setChatCommand(prompt)}
              className="text-[11px] bg-white hover:bg-edu-50 text-slate-600 hover:text-edu-700 px-2 py-0.5 rounded border border-slate-200 transition-colors shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* TALN Execution Feedback Banner */}
        {chatFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-lg border text-xs flex flex-col gap-2 ${
              chatFeedback.success
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 font-medium">
                {chatFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{chatFeedback.message}</span>
              </div>
              <button
                onClick={() => setChatFeedback(null)}
                className="text-slate-400 hover:text-slate-600 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {chatFeedback.sparql && (
              <div className="mt-1 pt-2 border-t border-emerald-200/60">
                <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-emerald-800">
                  <span>Requête SPARQL 1.1 exécutée dans le Triplestore :</span>
                  <button
                    onClick={() => handleCopySparql(chatFeedback.sparql!)}
                    className="flex items-center gap-1 hover:text-emerald-950 font-mono"
                  >
                    <Copy className="w-3 h-3" /> {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
                  {chatFeedback.sparql}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4. Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchNom}
              onChange={(e) => setSearchNom(e.target.value)}
              placeholder="Rechercher par titre, description ou mot-clé..."
              className="w-full text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2.5 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-edu-600 font-medium text-slate-700"
          >
            <option value="Tous">Toutes Catégories</option>
            <option value="Technique">Technique</option>
            <option value="Transversale">Transversale</option>
            <option value="Linguistique">Linguistique</option>
          </select>

          {/* Niveau Filter */}
          <select
            value={selectedNiveau}
            onChange={(e) => setSelectedNiveau(e.target.value)}
            className="text-xs py-2.5 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-edu-600 font-medium text-slate-700"
          >
            <option value="Tous">Tous Niveaux</option>
            <option value="Débutant">Débutant</option>
            <option value="Intermédiaire">Intermédiaire</option>
            <option value="Avancé">Avancé</option>
            <option value="Expert">Expert</option>
          </select>

          {/* Subclass Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs py-2.5 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-edu-600 font-medium text-slate-700 max-w-xs truncate"
          >
            <option value="Tous">Toutes Sous-Classes ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.class_name} value={c.class_name}>
                {c.label || c.class_name} ({c.category})
              </option>
            ))}
          </select>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Filtrer
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
            >
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
            >
              {viewMode === 'grid' ? 'Vue Tableau' : 'Vue Cartes'}
            </button>
          </div>
        </form>
      </Card>

      {/* 5. Competences List / Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-edu-600" />
          <p className="text-sm font-medium">Interrogation du graphe ontologique RDF...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-600 mb-2" />
          <h3 className="font-semibold text-sm">Erreur de chargement</h3>
          <p className="text-xs mt-1 text-rose-700">{error}</p>
        </div>
      ) : competences.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed border-2">
          <Award className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Aucune compétence trouvée</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Aucun individu ne correspond aux filtres appliqués. Vous pouvez créer une compétence manuellement ou via la commande TALN.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-edu-700 hover:bg-edu-800 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Ajouter une première compétence
          </button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competences.map((comp) => (
            <Card
              key={comp.id}
              className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200 bg-white group"
            >
              <div>
                {/* Header: Category & Level */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  {getCategoryBadge(comp.category)}
                  {getNiveauBadge(comp.niveau)}
                </div>

                {/* Title & Ontological Class */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-edu-700 transition-colors">
                  {comp.label}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                    edu:{comp.class_name}
                  </span>
                  {comp.langue && (
                    <span className="text-[11px] text-teal-700 font-medium">
                      ({comp.langue})
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                  {comp.description || 'Aucune description pédagogique renseignée pour cet individu.'}
                </p>

                {/* Semantic Relations */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                  {comp.developpee_par && comp.developpee_par.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-700">Développée par :</span>
                      <span className="font-mono text-slate-800 truncate">
                        {comp.developpee_par.join(', ')}
                      </span>
                    </div>
                  )}

                  {comp.prerequis_pour && comp.prerequis_pour.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Layers className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-700">Prérequis pour :</span>
                      <span className="font-mono text-slate-800 truncate">
                        {comp.prerequis_pour.join(', ')}
                      </span>
                    </div>
                  )}

                  {comp.acquise_par && comp.acquise_par.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-700">Acquise par :</span>
                      <span className="font-mono text-slate-800 truncate">
                        {comp.acquise_par.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={comp.uri}>
                  #{comp.id}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setActiveSparql(`PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>
SELECT ?p ?o WHERE {
  edu:${comp.id} ?p ?o .
}`)
                    }
                    className="p-1.5 text-slate-400 hover:text-edu-700 hover:bg-slate-100 rounded"
                    title="Inspecter le SPARQL"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(comp)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(comp)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Titre / Label</th>
                  <th className="py-3 px-4">Sous-Classe</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Niveau</th>
                  <th className="py-3 px-4">Relations</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {competences.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{comp.label}</div>
                      <div className="font-mono text-[10px] text-slate-400">edu:{comp.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-700">{comp.class_name}</span>
                    </td>
                    <td className="py-3 px-4">{getCategoryBadge(comp.category)}</td>
                    <td className="py-3 px-4">{getNiveauBadge(comp.niveau)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {comp.developpee_par?.length > 0 && (
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                            dev: {comp.developpee_par.join(', ')}
                          </span>
                        )}
                        {comp.prerequis_pour?.length > 0 && (
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-medium">
                            req: {comp.prerequis_pour.join(', ')}
                          </span>
                        )}
                        {comp.acquise_par?.length > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-medium">
                            acq: {comp.acquise_par.join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(comp)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(comp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Supprimer"
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
        </Card>
      )}

      {/* 6. Modal: Create Competence */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-edu-50 text-edu-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nouvelle Compétence</h3>
                  <p className="text-[11px] text-slate-500">Ajout d’un individu dans l’ontologie RDF</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Intitulé de la compétence *
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Ex: Programmation Web Réactive"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sous-classe ontologique *
                  </label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                  >
                    {classes.map((c) => (
                      <option key={c.class_name} value={c.class_name}>
                        {c.label || c.class_name} ({c.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Niveau d'exigence
                  </label>
                  <select
                    value={formNiveau}
                    onChange={(e) => setFormNiveau(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                  >
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description pédagogique
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Objectif de la compétence, critères d’évaluation..."
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Langue cible (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={formLangue}
                    onChange={(e) => setFormLangue(e.target.value)}
                    placeholder="Ex: Français, Anglais"
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identifiant URI personnalisé
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="Auto si vide (ex: Prog_Web_Ind)"
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-edu-700 hover:bg-edu-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Créer dans l'ontologie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Edit Competence */}
      {isEditModalOpen && selectedCompetence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Modifier : {selectedCompetence.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">edu:{selectedCompetence.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Intitulé de la compétence *
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sous-classe ontologique
                  </label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                  >
                    {classes.map((c) => (
                      <option key={c.class_name} value={c.class_name}>
                        {c.label || c.class_name} ({c.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Niveau d'exigence
                  </label>
                  <select
                    value={formNiveau}
                    onChange={(e) => setFormNiveau(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                  >
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description pédagogique
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Langue (Optionnel)
                </label>
                <input
                  type="text"
                  value={formLangue}
                  onChange={(e) => setFormLangue(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-edu-600 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-edu-700 hover:bg-edu-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                  Mettre à jour via SPARQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Delete Confirmation */}
      {isDeleteModalOpen && selectedCompetence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Supprimer la compétence ?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Êtes-vous certain de vouloir supprimer l'individu{' '}
              <strong className="text-slate-900">« {selectedCompetence.label} »</strong> (
              <span className="font-mono text-slate-700">edu:{selectedCompetence.id}</span>) ?
            </p>
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              Cette action supprimera tous les triplets RDF associés dans le triplestore.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: SPARQL Inspector */}
      {activeSparql && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-edu-700" />
                <h3 className="text-sm font-bold text-slate-900">Inspecteur SPARQL 1.1</h3>
              </div>
              <button
                onClick={() => setActiveSparql(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">SPARQL Query :</span>
                <button
                  onClick={() => handleCopySparql(activeSparql)}
                  className="flex items-center gap-1 text-xs text-edu-700 hover:text-edu-900 font-medium"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Copié !' : 'Copier la requête'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
                {activeSparql}
              </pre>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveSparql(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
