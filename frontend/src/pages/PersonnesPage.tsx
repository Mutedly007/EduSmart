import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Code2,
  RefreshCw,
  X,
  Mail,
  Phone,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { PersonneItem, PersonneClassItem, PersonneCreate } from '../types';

export const PersonnesPage: React.FC = () => {
  // Data states
  const [personnes, setPersonnes] = useState<PersonneItem[]>([]);
  const [classes, setClasses] = useState<PersonneClassItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchNom, setSearchNom] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Tous');

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
  const [selectedPersonne, setSelectedPersonne] = useState<PersonneItem | null>(null);

  // Form states
  const [formLabel, setFormLabel] = useState<string>('');
  const [formId, setFormId] = useState<string>('');
  const [formClass, setFormClass] = useState<string>('Etudiant');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formGrade, setFormGrade] = useState<string>('');
  const [formSpecialite, setFormSpecialite] = useState<string>('');
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
        api.getPersonnes({
          name: searchNom || undefined,
          class_name: selectedClass !== 'Tous' ? selectedClass : undefined,
        }),
        api.getPersonneClasses(),
      ]);
      setPersonnes(items);
      setClasses(clsList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données.');
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
    api.getPersonnes().then((items) => setPersonnes(items));
  };

  // Chat / Natural Language TALN command handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatCommand.trim()) return;

    setIsChatExecuting(true);
    setChatFeedback(null);
    try {
      const res = await api.executePersonneChat(chatCommand.trim());
      setChatFeedback({
        success: res.success,
        message: res.message,
        sparql: res.sparql,
      });
      if (res.sparql) {
        setActiveSparql(res.sparql);
      }
      setChatCommand('');
      // Reload list
      await fetchData();
    } catch (err: unknown) {
      setChatFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Échec de la commande TALN.',
      });
    } finally {
      setIsChatExecuting(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormLabel('');
    setFormId('');
    setFormClass(classes.length > 0 ? classes[0].class_name : 'Etudiant');
    setFormEmail('');
    setFormPhone('');
    setFormGrade('');
    setFormSpecialite('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: PersonneItem) => {
    setSelectedPersonne(p);
    setFormLabel(p.label);
    setFormId(p.id);
    setFormClass(p.class_name);
    setFormEmail(p.email || '');
    setFormPhone(p.telephone || '');
    setFormGrade(p.grade || '');
    setFormSpecialite(p.specialite || '');
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (p: PersonneItem) => {
    setSelectedPersonne(p);
    setIsDeleteModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: PersonneCreate = {
        label: formLabel.trim(),
        id: formId.trim() || undefined,
        class_name: formClass,
        email: formEmail.trim() || undefined,
        telephone: formPhone.trim() || undefined,
        grade: formGrade.trim() || undefined,
        specialite: formSpecialite.trim() || undefined,
      };

      const res = await api.createPersonne(payload);
      setActiveSparql(res.sparql);
      setIsCreateModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonne) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<PersonneCreate> = {
        label: formLabel.trim(),
        class_name: formClass,
        email: formEmail.trim(),
        telephone: formPhone.trim(),
        grade: formGrade.trim(),
        specialite: formSpecialite.trim(),
      };

      const res = await api.updatePersonne(selectedPersonne.id, payload);
      setActiveSparql(res.sparql);
      setIsEditModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!selectedPersonne) return;

    setIsSubmitting(true);
    try {
      const res = await api.deletePersonne(selectedPersonne.id);
      setActiveSparql(res.sparql);
      setIsDeleteModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySparql = () => {
    if (activeSparql) {
      navigator.clipboard.writeText(activeSparql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper for class badges
  const getClassBadgeVariant = (c: string) => {
    const cl = c.toLowerCase();
    if (cl.includes('prof') || cl.includes('enseignant')) return 'navy';
    if (cl.includes('etudiant') || cl.includes('doctorant')) return 'emerald';
    if (cl.includes('admin') || cl.includes('direction')) return 'amber';
    return 'blue';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold mb-1 border border-purple-200">
            <Users className="w-3.5 h-3.5" /> Branche Ontologique 4 — Personnes
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personnes</h1>
          <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
            Individus RDF de cette classe ou de l'une de ses sous-classes (Enseignants, Étudiants, Personnel Administratif...).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nouvel individu</span>
        </button>
      </div>

      {/* 2. Natural Language Text Chat / Command Bar */}
      <Card
        title="Assistant TALN Personnes"
        subtitle="Exécutez des commandes CRUD en langage naturel (français ou anglais)"
        icon={<Sparkles className="w-4 h-4 text-edu-600" />}
      >
        <form onSubmit={handleChatSubmit} className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={chatCommand}
                onChange={(e) => setChatCommand(e.target.value)}
                placeholder="Tapez une commande (ex: 'Créer un étudiant nommé Yassine Ben Ali' ou 'Supprimer la personne Ali')..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-edu-500 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isChatExecuting || !chatCommand.trim()}
              className="px-4 py-2.5 bg-edu-600 hover:bg-edu-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isChatExecuting ? 'animate-spin' : ''}`} />
              <span>{isChatExecuting ? 'Traitement...' : 'Exécuter'}</span>
            </button>
          </div>

          {/* Quick example chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">Exemples rapides :</span>
            {[
              'Créer un étudiant nommé Yassine Ben Ali',
              'Créer un enseignant nommé Dr. Sami Trabelsi',
              'Supprimer la personne Ali',
              'Lister les enseignants',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatCommand(chip)}
                className="text-[11px] bg-slate-100 hover:bg-edu-50 hover:text-edu-700 hover:border-edu-200 border border-transparent text-slate-600 px-2 py-0.5 rounded transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Feedback message */}
          {chatFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-2 mt-2 ${
                chatFeedback.success
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{chatFeedback.message}</span>
              </div>
              {chatFeedback.sparql && (
                <button
                  type="button"
                  onClick={() => setActiveSparql(chatFeedback.sparql || null)}
                  className="text-[11px] font-semibold text-edu-700 hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  <Code2 className="w-3.5 h-3.5" /> Voir SPARQL
                </button>
              )}
            </div>
          )}
        </form>
      </Card>

      {/* 3. Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-subtle">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nom / Identifiant</label>
            <input
              type="text"
              value={searchNom}
              onChange={(e) => setSearchNom(e.target.value)}
              placeholder="Rechercher par nom (ex: Ali, Ahmed, Sami)..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-edu-500"
            />
          </div>

          <div className="w-full md:w-64">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Classe</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500 font-medium"
            >
              <option value="Tous">-- Toutes les classes --</option>
              {classes.map((c) => (
                <option key={c.class_name} value={c.class_name}>
                  {c.label || c.class_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="submit"
              className="flex-1 md:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5" /> Rechercher
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* 4. Table of Individuals */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Individus Répertoriés
            </span>
            <Badge variant="blue" size="sm">
              {personnes.length} individus
            </Badge>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 text-xs flex items-center gap-2 border-b border-rose-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Individu (ID / URI)</th>
                <th className="py-3 px-4">Classe (Type)</th>
                <th className="py-3 px-4">Nom / Label</th>
                <th className="py-3 px-4">Coordonnées</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-edu-600" />
                    Chargement des individus depuis Apache Jena Fuseki...
                  </td>
                </tr>
              ) : personnes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Aucun individu trouvé</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Créez-en un via le bouton "+ Nouvel individu" ou la commande TALN ci-dessus.
                    </p>
                  </td>
                </tr>
              ) : (
                personnes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                        <span className="font-bold">{p.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block truncate max-w-xs" title={p.uri}>
                        {p.uri}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={getClassBadgeVariant(p.class_name)} size="sm">
                        {p.class_name.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.label}
                      {p.grade && (
                        <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                          Grade: {p.grade}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {p.email ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Pas d'email</span>
                      )}
                      {p.telephone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {p.telephone}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1 text-xs font-semibold text-edu-700 hover:text-edu-800 hover:bg-edu-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(p)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Live SPARQL Inspection Banner / Drawer */}
      {activeSparql && (
        <Card
          title="Dernière Requête SPARQL 1.1 Exécutée"
          subtitle="Générée dynamiquement et appliquée sur Apache Jena Fuseki"
          icon={<Code2 className="w-4 h-4 text-edu-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySparql}
                className="text-xs font-semibold text-edu-600 hover:text-edu-700 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSparql(null)}
                className="text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        >
          <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {activeSparql}
          </pre>
        </Card>
      )}

      {/* ===================== MODALS ===================== */}

      {/* Modal A: Création */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Ajouter un individu</h3>
                <p className="text-xs text-slate-500">Insertion SPARQL 1.1 dans la classe Personnes</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nom complet / Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => {
                    setFormLabel(e.target.value);
                    if (!formId || formId === formLabel.replace(/[\s-]+/g, '_')) {
                      setFormId(e.target.value.replace(/[\s-]+/g, '_'));
                    }
                  }}
                  placeholder="ex: Dr. Sami Trabelsi ou Yassine Ben Ali"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Identifiant RDF (URI)</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="ex: Sami_Trabelsi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Classe Ontologique <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-edu-500"
                  >
                    {classes.map((c) => (
                      <option key={c.class_name} value={c.class_name}>
                        {c.label || c.class_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="sami@edusmart.tn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+216 22 123 456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Grade (si Enseignant)</label>
                  <input
                    type="text"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    placeholder="Professeur, Maître Assistant..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Spécialité / Filière</label>
                  <input
                    type="text"
                    value={formSpecialite}
                    onChange={(e) => setFormSpecialite(e.target.value)}
                    placeholder="Génie Logiciel, IA, Data..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Insertion...' : 'Créer l\'individu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: Modification */}
      {isEditModalOpen && selectedPersonne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-edu-50 text-edu-600 flex items-center justify-center">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Modifier l'individu</h3>
                <p className="text-xs text-slate-500 font-mono">edu:{selectedPersonne.id}</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom complet / Label</label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Classe</label>
                <select
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-edu-500"
                >
                  {classes.map((c) => (
                    <option key={c.class_name} value={c.class_name}>
                      {c.label || c.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Grade</label>
                  <input
                    type="text"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Spécialité</label>
                  <input
                    type="text"
                    value={formSpecialite}
                    onChange={(e) => setFormSpecialite(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-edu-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-edu-600 hover:bg-edu-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mise à jour...' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Suppression */}
      {isDeleteModalOpen && selectedPersonne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-elevated border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-rose-600">
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Supprimer cet individu ?</h3>
                <p className="text-xs text-rose-700">Suppression permanente dans Apache Jena Fuseki</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Êtes-vous sûr de vouloir supprimer <strong>{selectedPersonne.label}</strong> (
              <code className="font-mono text-slate-800 font-semibold">{selectedPersonne.id}</code>) ?
              Cette action exécutera une requête SPARQL <code>DELETE WHERE</code> irréversible.
            </p>

            <div className="p-2.5 bg-slate-900 text-slate-300 font-mono text-[11px] rounded-lg mb-4 border border-slate-800">
              DELETE WHERE &#123; edu:{selectedPersonne.id} ?p ?o &#125;
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Suppression...' : 'Confirmer la suppression'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
