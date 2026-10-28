import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Code2,
  RefreshCw,
  X,
  Globe,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
  Copy,
  ExternalLink,
  GraduationCap,
  Users,
  BookOpen,
  Download,
  Check,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon,
  Share2,
  UserPlus,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type {
  EtablissementItem,
  EtablissementClassItem,
  EtablissementCreate,
  PersonneItem,
} from '../types';

export const EtablissementsPage: React.FC = () => {
  // Data states
  const [etablissements, setEtablissements] = useState<EtablissementItem[]>([]);
  const [classes, setClasses] = useState<EtablissementClassItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states (Valeur Ajoutée n°4: Filtrage Géographique & Typologique Avancé)
  const [searchNom, setSearchNom] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Tous');
  const [selectedVille, setSelectedVille] = useState<string>('Toutes');
  const [selectedStatut, setSelectedStatut] = useState<string>('Tous');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Text chat / TALN command state
  const [chatCommand, setChatCommand] = useState<string>('');
  const [isChatExecuting, setIsChatExecuting] = useState<boolean>(false);
  const [chatFeedback, setChatFeedback] = useState<{
    success: boolean;
    message: string;
    sparql?: string | null;
  } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isHubDetailModalOpen, setIsHubDetailModalOpen] = useState<boolean>(false);
  const [selectedEtab, setSelectedEtab] = useState<EtablissementItem | null>(null);

  // Form states
  const [formLabel, setFormLabel] = useState<string>('');
  const [formId, setFormId] = useState<string>('');
  const [formClass, setFormClass] = useState<string>('Universite_Privee');
  const [formVille, setFormVille] = useState<string>('Tunis');
  const [formAdresse, setFormAdresse] = useState<string>('');
  const [formSiteWeb, setFormSiteWeb] = useState<string>('');
  const [formTelephone, setFormTelephone] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formStatut, setFormStatut] = useState<string>('Accrédité');
  const [formDescription, setFormDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // SPARQL Inspector Drawer
  const [activeSparql, setActiveSparql] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Turtle Export Modal
  const [turtleContent, setTurtleContent] = useState<string | null>(null);
  const [isTurtleModalOpen, setIsTurtleModalOpen] = useState<boolean>(false);

  // Add Student Modal
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);
  const [availableStudents, setAvailableStudents] = useState<PersonneItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  // Load initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [items, clsList] = await Promise.all([
        api.getEtablissements({
          name: searchNom || undefined,
          class_name: selectedClass !== 'Tous' ? selectedClass : undefined,
          ville: selectedVille !== 'Toutes' ? selectedVille : undefined,
          statut: selectedStatut !== 'Tous' ? selectedStatut : undefined,
        }),
        api.getEtablissementClasses(),
      ]);
      setEtablissements(items);
      setClasses(clsList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des établissements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleResetFilters = () => {
    setSearchNom('');
    setSelectedClass('Tous');
    setSelectedVille('Toutes');
    setSelectedStatut('Tous');
    api.getEtablissements().then((items) => setEtablissements(items));
  };

  // Chat / TALN command handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatCommand.trim()) return;

    setIsChatExecuting(true);
    setChatFeedback(null);
    try {
      const res = await api.executeEtablissementChat(chatCommand.trim());
      setChatFeedback({
        success: res.success,
        message: res.message,
        sparql: res.sparql,
      });

      if (res.success) {
        // If the backend returned the updated list, use it directly.
        // This avoids re-fetching from RDFLib which loses in-memory SPARQL inserts.
        if (res.records && res.records.length > 0) {
          setEtablissements(res.records as EtablissementItem[]);
        } else {
          // Fallback for list/search commands that don't return records
          await fetchData();
        }
      }
      setChatCommand('');
    } catch (err: unknown) {
      setChatFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Erreur lors du traitement de la commande TALN.',
      });
    } finally {
      setIsChatExecuting(false);
    }
  };


  // Open Create Modal
  const handleOpenCreate = () => {
    setFormLabel('');
    setFormId('');
    setFormClass('Universite_Privee');
    setFormVille('Tunis');
    setFormAdresse('');
    setFormSiteWeb('');
    setFormTelephone('');
    setFormEmail('');
    setFormStatut('Accrédité');
    setFormDescription('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: EtablissementItem) => {
    setSelectedEtab(item);
    setFormLabel(item.label);
    setFormId(item.id);
    setFormClass(item.class_name);
    setFormVille(item.ville || 'Tunis');
    setFormAdresse(item.adresse || '');
    setFormSiteWeb(item.site_web || '');
    setFormTelephone(item.telephone || '');
    setFormEmail(item.email || '');
    setFormStatut(item.statut || 'Accrédité');
    setFormDescription(item.description || '');
    setIsEditModalOpen(true);
  };

  // Open Hub Detail Modal (Valeur Ajoutée n°1)
  const handleOpenHubDetail = (item: EtablissementItem) => {
    setSelectedEtab(item);
    setIsHubDetailModalOpen(true);
  };

  // Export Turtle
  const handleExportTurtle = async (item: EtablissementItem) => {
    try {
      const turtle = await api.exportEtablissementTurtle(item.id);
      setTurtleContent(turtle);
      setSelectedEtab(item);
      setIsTurtleModalOpen(true);
    } catch (err: unknown) {
      alert("Erreur lors de l'export Turtle");
    }
  };

  // Open Add Student Modal
  const handleOpenAddStudent = async (item: EtablissementItem) => {
    setSelectedEtab(item);
    setIsAddStudentModalOpen(true);
    setIsLoadingStudents(true);
    try {
      const students = await api.getPersonnes({ class_name: 'Etudiant' });
      if (students && students.length > 0) {
        setAvailableStudents(students);
        setSelectedStudentId(students[0]?.id || '');
      } else {
        const allPersons = await api.getPersonnes();
        setAvailableStudents(allPersons);
        setSelectedStudentId(allPersons[0]?.id || '');
      }
    } catch (err: unknown) {
      console.error('Erreur chargement étudiants', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Submit Add Student
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEtab || !selectedStudentId) return;

    setIsSubmitting(true);
    try {
      const res = await api.addStudentToEtablissement(selectedEtab.id, selectedStudentId);
      setActiveSparql(res.sparql);
      setIsAddStudentModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors du rattachement de l'étudiant");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: EtablissementCreate = {
        label: formLabel.trim(),
        id: formId.trim() || undefined,
        class_name: formClass,
        ville: formVille.trim() || 'Tunis',
        adresse: formAdresse.trim() || undefined,
        site_web: formSiteWeb.trim() || undefined,
        telephone: formTelephone.trim() || undefined,
        email: formEmail.trim() || undefined,
        statut: formStatut.trim() || 'Accrédité',
        description: formDescription.trim() || undefined,
      };
      const res = await api.createEtablissement(payload);
      setActiveSparql(res.sparql);
      setIsCreateModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEtab) return;

    setIsSubmitting(true);
    try {
      const payload = {
        label: formLabel.trim(),
        class_name: formClass,
        ville: formVille.trim() || undefined,
        adresse: formAdresse.trim() || undefined,
        site_web: formSiteWeb.trim() || undefined,
        telephone: formTelephone.trim() || undefined,
        email: formEmail.trim() || undefined,
        statut: formStatut.trim() || undefined,
        description: formDescription.trim() || undefined,
      };
      const res = await api.updateEtablissement(selectedEtab.id, payload);
      setActiveSparql(res.sparql);
      setIsEditModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!selectedEtab) return;

    setIsSubmitting(true);
    try {
      const res = await api.deleteEtablissement(selectedEtab.id);
      setActiveSparql(res.sparql);
      setIsDeleteModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySparql = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derived Statistics (Valeur Ajoutée n°4)
  const totalCount = etablissements.length;
  const uniqueVilles = Array.from(new Set(etablissements.map((x) => x.ville).filter(Boolean)));
  const totalStudents = etablissements.reduce((acc, cur) => acc + cur.etudiants_inscrits.length, 0);
  const totalProgrammes = etablissements.reduce(
    (acc, cur) => acc + cur.programmes_proposes.length + cur.formations_organisees.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-sky-50 text-sky-800 rounded-full text-xs font-semibold mb-2 border border-sky-200">
            <Building2 className="w-3.5 h-3.5" /> Ontologie W3C • Branche Établissement
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestion des Établissements & Hub Sémantique
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Exploration et gestion sémantique des universités, écoles, instituts et centres de formation.
            Interconnexion dynamique avec les étudiants rattachés, les programmes et les formations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={fetchData}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Actualiser depuis Fuseki"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouvel Établissement
          </button>
        </div>
      </div>

      {/* 2. Metrics & KPI Cards (Valeur Ajoutée n°4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-white to-sky-50/40 border-sky-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Établissements</span>
            <div className="p-2 bg-sky-100/70 text-sky-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Individus dans le triplestore</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-indigo-50/40 border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Villes Couvertes</span>
            <div className="p-2 bg-indigo-100/70 text-indigo-700 rounded-lg">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{uniqueVilles.length || 1}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {uniqueVilles.slice(0, 3).join(', ') || 'Ariana, Tunis'}
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-emerald-50/40 border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Formations & Offres</span>
            <div className="p-2 bg-emerald-100/70 text-emerald-700 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalProgrammes}</div>
          <p className="text-[11px] text-slate-500 mt-1">Via edu:organise & edu:propose</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-purple-50/40 border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Étudiants Rattachés</span>
            <div className="p-2 bg-purple-100/70 text-purple-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalStudents}</div>
          <p className="text-[11px] text-slate-500 mt-1">Via edu:appartientA (Hub)</p>
        </Card>
      </div>

      {/* 3. TALN Natural Language Assistant Box (Conforme spaCy Non-LLM) */}
      <Card className="p-5 border-sky-200 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-600 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Assistant TALN pour Établissements (NLP Déterministe spaCy)
              </h3>
              <p className="text-xs text-slate-600">
                Exécutez des requêtes et commandes en langage naturel sans LLM externe
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full border border-sky-300 font-semibold">
            fr_core_news_sm + RegEx
          </span>
        </div>

        <form onSubmit={handleChatSubmit} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={chatCommand}
              onChange={(e) => setChatCommand(e.target.value)}
              placeholder="Ex: 'créer une université privée nommée SESAME à Ariana', 'lister les universités privées', 'modifier le site web de ESPRIT à https://esprit.tn'..."
              className="w-full pl-3 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 shadow-sm"
              disabled={isChatExecuting}
            />
            {chatCommand && (
              <button
                type="button"
                onClick={() => setChatCommand('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isChatExecuting || !chatCommand.trim()}
            className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 flex-shrink-0"
          >
            {isChatExecuting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Exécuter TALN
          </button>
        </form>

        {/* Suggestion pills */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-600">
          <span className="text-slate-500 font-medium">Exemples :</span>
          <button
            type="button"
            onClick={() => setChatCommand('lister les universités privées')}
            className="px-2.5 py-1 bg-white hover:bg-sky-100 text-slate-700 rounded-md border border-slate-200 text-[11px] transition-colors"
          >
            🔍 Lister les universités privées
          </button>
          <button
            type="button"
            onClick={() => setChatCommand('créer une université privée nommée SESAME à Ariana')}
            className="px-2.5 py-1 bg-white hover:bg-sky-100 text-slate-700 rounded-md border border-slate-200 text-[11px] transition-colors"
          >
            ➕ Créer université SESAME à Ariana
          </button>
          <button
            type="button"
            onClick={() => setChatCommand('modifier le site web de ESPRIT à https://esprit.tn')}
            className="px-2.5 py-1 bg-white hover:bg-sky-100 text-slate-700 rounded-md border border-slate-200 text-[11px] transition-colors"
          >
            ✏️ Modifier le site web de ESPRIT
          </button>
          <button
            type="button"
            onClick={() => setChatCommand('lister les établissements à Tunis')}
            className="px-2.5 py-1 bg-white hover:bg-sky-100 text-slate-700 rounded-md border border-slate-200 text-[11px] transition-colors"
          >
            📍 Établissements à Tunis
          </button>
        </div>

        {/* Chat Feedback Message */}
        {chatFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
              chatFeedback.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {chatFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{chatFeedback.message}</p>
                {chatFeedback.sparql && (
                  <p className="text-[11px] text-slate-600 mt-1">
                    Requête SPARQL générée avec succès et exécutée contre Apache Jena Fuseki.
                  </p>
                )}
              </div>
            </div>
            {chatFeedback.sparql && (
              <button
                type="button"
                onClick={() => setActiveSparql(chatFeedback.sparql || null)}
                className="px-2.5 py-1 bg-white text-slate-800 rounded border border-slate-300 font-mono text-[11px] hover:bg-slate-50 flex-shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <Code2 className="w-3.5 h-3.5 text-sky-600" /> Voir SPARQL
              </button>
            )}
          </div>
        )}
      </Card>

      {/* 4. Filter Bar (Valeur Ajoutée n°4: Filtrage Géographique & Typologique) */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search Nom */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchNom}
                onChange={(e) => setSearchNom(e.target.value)}
                placeholder="Rechercher par nom..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
              >
                <option value="Tous">Tous les Types ({classes.length || 'Défaut'})</option>
                {classes.length > 0 ? (
                  classes.map((c) => (
                    <option key={c.class_name} value={c.class_name}>
                      {c.label || c.class_name.replace(/_/g, ' ')}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Universite_Privee">Université Privée</option>
                    <option value="Universite_Publique">Université Publique</option>
                    <option value="Universite">Université (Générale)</option>
                    <option value="Ecole">École d'Ingénieurs / Commerce</option>
                    <option value="Institut">Institut Supérieur</option>
                    <option value="Centre_Formation">Centre de Formation</option>
                  </>
                )}
              </select>
            </div>

            {/* Ville Filter (Valeur Ajoutée n°4) */}
            <div>
              <select
                value={selectedVille}
                onChange={(e) => setSelectedVille(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
              >
                <option value="Toutes">Toutes les Villes</option>
                <option value="Ariana">Ariana</option>
                <option value="Tunis">Tunis</option>
                <option value="Sousse">Sousse</option>
                <option value="Sfax">Sfax</option>
                <option value="Monastir">Monastir</option>
                <option value="Bizerte">Bizerte</option>
                <option value="Nabeul">Nabeul</option>
              </select>
            </div>

            {/* Statut Filter */}
            <div>
              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
              >
                <option value="Tous">Tous les Statuts</option>
                <option value="Accrédité">Accrédité</option>
                <option value="Privé">Privé</option>
                <option value="Public">Public</option>
                <option value="Partenaire">Partenaire</option>
                <option value="Actif">Actif</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
              >
                Appliquer Filtres
              </button>
              {(searchNom || selectedClass !== 'Tous' || selectedVille !== 'Toutes' || selectedStatut !== 'Tous') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Affichage en Grille"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grille
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Affichage en Tableau"
              >
                <ListIcon className="w-3.5 h-3.5" /> Tableau
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* 5. Main Content: Grid / Cards or Table */}
      {isLoading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Chargement des données sémantiques depuis Fuseki...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-800 text-sm">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors shadow-sm"
          >
            Réessayer
          </button>
        </div>
      ) : etablissements.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Aucun établissement trouvé</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Aucun individu ne correspond à vos filtres de recherche. Vous pouvez en créer un nouveau ou réinitialiser les filtres.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter un Établissement
          </button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRILLE DE CARTES SÉMANTIQUES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {etablissements.map((item) => (
            <Card
              key={item.id}
              className="p-5 flex flex-col justify-between hover:border-sky-300 transition-all shadow-sm hover:shadow-md bg-white border-slate-200"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                      {item.label.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug tracking-tight">
                        {item.label}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-500">edu:{item.id}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="blue" className="text-[10px] uppercase font-semibold">
                    {item.class_name.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Location & Contact Info */}
                <div className="space-y-1.5 my-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                    <span className="font-medium text-slate-800">{item.ville || 'Non spécifiée'}</span>
                    {item.adresse && <span className="text-slate-400">• {item.adresse}</span>}
                  </div>

                  {item.site_web && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a
                        href={item.site_web}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 hover:underline truncate inline-flex items-center gap-1"
                      >
                        {item.site_web.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {item.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{item.telephone}</span>
                    </div>
                  )}

                  {item.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{item.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-3 h-3" /> {item.statut || 'Accrédité'}
                    </span>
                    <span className="text-[11px] text-slate-400">• {item.mode_enseignement}</span>
                  </div>
                </div>

                {/* VALEUR AJOUTÉE N°1: LE HUB SÉMANTIQUE INTER-BRANCHES */}
                <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-indigo-600" /> Hub Sémantique
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenHubDetail(item)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                    >
                      Détails complets &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {/* Programmes & Formations */}
                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
                      <div className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                        <BookOpen className="w-3 h-3 text-sky-600" /> Formations ({item.formations_organisees.length + item.programmes_proposes.length})
                      </div>
                      <div className="truncate text-slate-800 font-semibold">
                        {item.formations_organisees[0]?.label || item.programmes_proposes[0]?.label || 'Aucune formation'}
                      </div>
                    </div>

                    {/* Étudiants Rattachés */}
                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
                      <div className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                        <Users className="w-3 h-3 text-purple-600" /> Étudiants ({item.etudiants_inscrits.length})
                      </div>
                      <div className="truncate text-slate-800 font-semibold">
                        {item.etudiants_inscrits[0]?.label || 'Aucun étudiant'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleExportTurtle(item)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                    title="Exporter RDF Turtle (.ttl)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sparqlSample = `PREFIX edu: <http://www.semanticweb.org/msi/ontologies/2026/9/Education_Formation#>\n\nSELECT ?p ?o WHERE {\n  edu:${item.id} ?p ?o .\n}`;
                      setActiveSparql(sparqlSample);
                    }}
                    className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded border border-slate-200 transition-colors"
                    title="Inspecter les requêtes SPARQL"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenAddStudent(item)}
                    className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                    title="Rattacher un étudiant (edu:appartientA)"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                    title="Modifier l'établissement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEtab(item);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer l'établissement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLEAU DÉTAILLÉ */
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Établissement</th>
                  <th className="py-3 px-4">Type Ontologique</th>
                  <th className="py-3 px-4">Ville</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Hub Sémantique (Formations / Étudiants)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {etablissements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{item.label}</div>
                      <div className="text-[10px] font-mono text-slate-400">edu:{item.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="blue" className="text-[10px]">
                        {item.class_name.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-600" /> {item.ville || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.statut || 'Accrédité'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenHubDetail(item)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {item.formations_organisees.length + item.programmes_proposes.length} Formations • {item.etudiants_inscrits.length} Étudiants
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenAddStudent(item)}
                        className="p-1 text-slate-500 hover:text-purple-700 rounded"
                        title="Rattacher un étudiant"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-slate-500 hover:text-sky-700 rounded"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEtab(item);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-red-700 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 6. MODAL CRÉATION / MODIFICATION */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-lg p-6 bg-white border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isCreateModalOpen ? 'Ajouter un Établissement (SPARQL INSERT)' : "Modifier l'Établissement (SPARQL UPDATE)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isCreateModalOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom de l'établissement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Ex: SESAME, INSAT, Université de Tunis..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                />
              </div>

              {isCreateModalOpen && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Identifiant URI (optionnel, auto-généré si vide)
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="Ex: SESAME (deviendra edu:SESAME)"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type Ontologique</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                  >
                    {classes.length > 0 ? (
                      classes.map((c) => (
                        <option key={c.class_name} value={c.class_name}>
                          {c.label || c.class_name.replace(/_/g, ' ')}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Universite_Privee">Université Privée</option>
                        <option value="Universite_Publique">Université Publique</option>
                        <option value="Universite">Université</option>
                        <option value="Ecole">École d'Ingénieurs / Commerce</option>
                        <option value="Institut">Institut Supérieur</option>
                        <option value="Centre_Formation">Centre de Formation</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={formVille}
                    onChange={(e) => setFormVille(e.target.value)}
                    placeholder="Ex: Ariana, Tunis, Sousse..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={formAdresse}
                  onChange={(e) => setFormAdresse(e.target.value)}
                  placeholder="Ex: Pôle Technologique El Ghazala, Z.I Chotrana"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Web</label>
                  <input
                    type="url"
                    value={formSiteWeb}
                    onChange={(e) => setFormSiteWeb(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut</label>
                  <select
                    value={formStatut}
                    onChange={(e) => setFormStatut(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                  >
                    <option value="Accrédité">Accrédité</option>
                    <option value="Privé">Privé</option>
                    <option value="Public">Public</option>
                    <option value="Partenaire">Partenaire</option>
                    <option value="Actif">Actif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formTelephone}
                    onChange={(e) => setFormTelephone(e.target.value)}
                    placeholder="+216 ..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email officiel</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="contact@..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description pédagogique</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Informations sur les spécialités, accréditations internationales..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {isCreateModalOpen ? 'Insérer dans Fuseki' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 7. MODAL DE CONFIRMATION DE SUPPRESSION */}
      {isDeleteModalOpen && selectedEtab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-md p-6 bg-white border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Supprimer l'Établissement</h3>
                <p className="text-xs text-slate-500">Action SPARQL DELETE WHERE irréversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer l'individu{' '}
              <strong className="text-slate-900 font-semibold">{selectedEtab.label}</strong> (
              <code className="font-mono text-sky-700">edu:{selectedEtab.id}</code>) ? Tous les triplets associés dans
              Apache Jena Fuseki seront effacés.
            </p>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteSubmit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirmer la suppression
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* 8. VALEUR AJOUTÉE N°1: MODAL VUE DÉTAILLÉE DU HUB SÉMANTIQUE */}
      {isHubDetailModalOpen && selectedEtab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-2xl p-6 bg-white border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-gradient-to-br from-sky-600 to-indigo-700 text-white rounded-xl shadow-sm">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Hub Sémantique Inter-Branches : {selectedEtab.label}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">URI : {selectedEtab.uri}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHubDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Informations Générales */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Type & Statut</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEtab.class_name.replace(/_/g, ' ')} ({selectedEtab.statut})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Ville & Modalité</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEtab.ville || 'Ariana'} • {selectedEtab.mode_enseignement}
                  </span>
                </div>
              </div>

              {/* Formations & Programmes organisés (edu:organise, edu:propose) */}
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100">
                <h4 className="font-bold text-sky-950 flex items-center gap-2 mb-2 text-sm">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  Formations & Programmes Proposés ({selectedEtab.formations_organisees.length + selectedEtab.programmes_proposes.length})
                </h4>
                <p className="text-[11px] text-slate-600 mb-3">
                  Relations ontologiques directes via les prédicats <code className="font-mono bg-sky-100 px-1 py-0.5 rounded">edu:organise</code> et <code className="font-mono bg-sky-100 px-1 py-0.5 rounded">edu:propose</code>.
                </p>
                <div className="space-y-2">
                  {[...selectedEtab.formations_organisees, ...selectedEtab.programmes_proposes].map((rel, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-lg border border-sky-200 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{rel.label}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">edu:{rel.id}</span>
                      </div>
                      <Badge variant="blue" className="text-[10px]">
                        {rel.type_name}
                      </Badge>
                    </div>
                  ))}
                  {selectedEtab.formations_organisees.length === 0 && selectedEtab.programmes_proposes.length === 0 && (
                    <p className="text-slate-400 italic">Aucune formation liée pour cet établissement.</p>
                  )}
                </div>
              </div>

              {/* Étudiants Rattachés (inverse edu:appartientA) */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <h4 className="font-bold text-purple-950 flex items-center gap-2 mb-2 text-sm">
                  <Users className="w-4 h-4 text-purple-600" />
                  Étudiants Inscrits ({selectedEtab.etudiants_inscrits.length})
                </h4>
                <p className="text-[11px] text-slate-600 mb-3">
                  Connexion sémantique inverse depuis la branche Personnes via <code className="font-mono bg-purple-100 px-1 py-0.5 rounded">?etudiant edu:appartientA edu:{selectedEtab.id}</code>.
                </p>
                <div className="space-y-2">
                  {selectedEtab.etudiants_inscrits.map((rel, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-lg border border-purple-200 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{rel.label}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">edu:{rel.id}</span>
                      </div>
                      <Badge variant="purple" className="text-[10px]">
                        Étudiant Inscrit
                      </Badge>
                    </div>
                  ))}
                  {selectedEtab.etudiants_inscrits.length === 0 && (
                    <p className="text-slate-400 italic">Aucun étudiant rattaché dans la base pour le moment.</p>
                  )}
                </div>
              </div>

              {/* Enseignants Affiliés */}
              {selectedEtab.enseignants_affilies.length > 0 && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-2 mb-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    Corps Enseignant Affilié ({selectedEtab.enseignants_affilies.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedEtab.enseignants_affilies.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white rounded-lg border border-emerald-200 flex items-center justify-between shadow-2xs"
                      >
                        <span className="font-semibold text-slate-900">{rel.label}</span>
                        <Badge variant="emerald" className="text-[10px]">
                          Enseignant
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 mt-5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHubDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors shadow-sm"
              >
                Fermer
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* 9. MODAL EXPORT W3C TURTLE */}
      {isTurtleModalOpen && turtleContent && selectedEtab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-xl p-6 bg-white border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Export Sémantique RDF Turtle</h3>
                  <p className="text-xs text-slate-500">Standard W3C pour l'établissement {selectedEtab.label}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTurtleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
                {turtleContent}
              </pre>
              <button
                onClick={() => handleCopySparql(turtleContent)}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] flex items-center gap-1 border border-slate-700 shadow-sm transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTurtleModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors shadow-sm"
              >
                Fermer
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* 9bis. MODAL RATTACHEMENT D'UN ÉTUDIANT (edu:appartientA) */}
      {isAddStudentModalOpen && selectedEtab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-lg p-6 bg-white border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Rattacher un Étudiant</h3>
                  <p className="text-xs text-slate-500">
                    Établissement cible : <span className="font-semibold text-purple-700">{selectedEtab.label}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900">
                <span className="font-semibold">Relation sémantique W3C : </span>
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-800">
                  edu:{'{étudiant}'} edu:appartientA edu:{selectedEtab.id}
                </code>
              </div>

              {/* Étudiants déjà inscrits */}
              {selectedEtab.etudiants_inscrits.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Étudiants actuellement rattachés ({selectedEtab.etudiants_inscrits.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEtab.etudiants_inscrits.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium"
                      >
                        <Users className="w-3 h-3 text-purple-600" />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sélectionner un étudiant existant dans la base
                </label>
                {isLoadingStudents ? (
                  <div className="flex items-center justify-center p-6 text-slate-500 text-xs gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                    Chargement des étudiants...
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200">
                    Aucun étudiant trouvé dans la branche Personnes.
                  </div>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-900 font-medium"
                    required
                  >
                    {availableStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label} (ID: edu:{st.id} {st.specialite ? `• ${st.specialite}` : ''})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-semibold hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingStudents || !selectedStudentId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  {isSubmitting ? 'Rattachement...' : "Confirmer l'inscription"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 10. TIROIR INSPECTEUR SPARQL EN DIRECT (SPARQL DRAWER) */}
      {activeSparql && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 text-white shadow-2xl p-6 flex flex-col justify-between border-l border-slate-800 animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Inspecteur SPARQL 1.1 W3C</h3>
                  <p className="text-[11px] text-slate-400">Exécuté sur Apache Jena Fuseki (/edusmart)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSparql(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Requête exécutée en direct :</span>
                <button
                  onClick={() => handleCopySparql(activeSparql)}
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 text-sky-300 rounded-xl font-mono text-xs overflow-x-auto max-h-[60vh] border border-slate-800/80 leading-relaxed">
                {activeSparql}
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Dataset Fuseki Synchronisé
            </span>
            <button
              onClick={() => setActiveSparql(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Fermer l'inspecteur
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EtablissementsPage;
