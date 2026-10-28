import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Clock3,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
  Code2,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import type { FormationClassItem, FormationCreate, FormationItem, FormationUpdate } from '../types';

interface FormationForm {
  id: string;
  label: string;
  class_name: string;
  description: string;
  duration: string;
  objective: string;
  price: string;
  domain: string;
  modality: string;
}

const EMPTY_FORM: FormationForm = {
  id: '',
  label: '',
  class_name: 'Formation',
  description: '',
  duration: '',
  objective: '',
  price: '',
  domain: '',
  modality: '',
};

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-edu-500 focus:outline-none focus:ring-2 focus:ring-edu-100';
const labelClass = 'mb-1 block text-xs font-semibold text-slate-600';

export const FormationsPage: React.FC = () => {
  const [formations, setFormations] = useState<FormationItem[]>([]);
  const [classes, setClasses] = useState<FormationClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [chatCommand, setChatCommand] = useState('');
  const [isChatExecuting, setIsChatExecuting] = useState(false);
  const [chatFeedback, setChatFeedback] = useState<{
    success: boolean;
    message: string;
    sparql?: string | null;
    action: string;
  } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedClass, setAppliedClass] = useState('');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<FormationForm>(EMPTY_FORM);
  const [selectedFormation, setSelectedFormation] = useState<FormationItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormationItem | null>(null);

  const loadData = useCallback(async (name?: string, className?: string) => {
    try {
      const [items, availableClasses] = await Promise.all([
        api.getFormations({ name: name || undefined, class_name: className || undefined }),
        api.getFormationClasses(),
      ]);
      setFormations(items);
      setClasses(availableClasses);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les formations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadData = useCallback((name?: string, className?: string) => {
    setIsLoading(true);
    setError(null);
    void loadData(name, className);
  }, [loadData]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedSearch(searchText.trim());
    setAppliedClass(selectedClass);
    reloadData(searchText.trim(), selectedClass);
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedClass('');
    setAppliedSearch('');
    setAppliedClass('');
    reloadData();
  };

  const handleChatSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const command = chatCommand.trim();
    if (!command) return;

    setIsChatExecuting(true);
    setChatFeedback(null);
    try {
      const response = await api.executeFormationCommand(command);
      setChatFeedback({
        success: response.success,
        message: response.message,
        sparql: response.sparql,
        action: response.action,
      });
      setChatCommand('');
      if (response.action === 'create' || response.action === 'update' || response.action === 'delete' || response.action === 'list') {
        reloadData(appliedSearch, appliedClass);
      }
    } catch (requestError: unknown) {
      setChatFeedback({
        success: false,
        message: requestError instanceof Error ? requestError.message : 'Échec de la commande TALN.',
        action: 'error',
      });
    } finally {
      setIsChatExecuting(false);
    }
  };

  const openCreate = () => {
    setSelectedFormation(null);
    setForm({ ...EMPTY_FORM, class_name: 'Formation' });
    setError(null);
    setNotice(null);
    setFormMode('create');
  };

  const openEdit = (formation: FormationItem) => {
    setSelectedFormation(formation);
    setForm({
      id: formation.id,
      label: formation.label,
      class_name: formation.class_name,
      description: formation.description ?? '',
      duration: formation.duration?.toString() ?? '',
      objective: formation.objective ?? '',
      price: formation.price?.toString() ?? '',
      domain: formation.domain ?? '',
      modality: formation.modality ?? '',
    });
    setError(null);
    setNotice(null);
    setFormMode('edit');
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.label.trim()) {
      setError('Le nom de la formation est obligatoire.');
      return;
    }

    const duration = form.duration.trim() ? Number(form.duration) : undefined;
    const price = form.price.trim() ? Number(form.price) : undefined;
    if ((duration !== undefined && (!Number.isFinite(duration) || duration < 0))
      || (price !== undefined && (!Number.isFinite(price) || price < 0))) {
      setError('La durée et le prix doivent être des nombres positifs ou nuls.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (formMode === 'create') {
        const payload: FormationCreate = {
          id: form.id.trim() || undefined,
          label: form.label.trim(),
          class_name: form.class_name,
          description: form.description.trim() || undefined,
          duration,
          objective: form.objective.trim() || undefined,
          price,
          domain: form.domain.trim() || undefined,
          modality: form.modality.trim() || undefined,
        };
        const result = await api.createFormation(payload);
        setNotice(result.message || 'Formation créée.');
      } else if (selectedFormation) {
        const payload: FormationUpdate = {
          label: form.label.trim(),
          class_name: form.class_name,
          description: form.description.trim() || null,
          duration: duration ?? null,
          objective: form.objective.trim() || null,
          price: price ?? null,
          domain: form.domain.trim() || null,
          modality: form.modality.trim() || null,
        };
        const result = await api.updateFormation(selectedFormation.id, payload);
        setNotice(result.message || 'Formation mise à jour.');
      }

      setFormMode(null);
      reloadData(appliedSearch, appliedClass);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible d’enregistrer la formation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await api.deleteFormation(deleteTarget.id);
      setNotice(result.message || 'Formation supprimée.');
      setDeleteTarget(null);
      reloadData(appliedSearch, appliedClass);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de supprimer la formation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (field: keyof FormationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-edu-200 bg-edu-50 px-2.5 py-1 text-xs font-semibold text-edu-700">
            <BookOpen className="h-3.5 w-3.5" /> Branche ontologique — Formation
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Formations</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Consultez et gérez les formations de l’ontologie EduSmart.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Nouvelle formation
        </button>
      </header>

      {notice && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button type="button" aria-label="Fermer le message" onClick={() => setNotice(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && !formMode && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card
        title="Assistant TALN Formations"
        subtitle="Commandes déterministes en français ou en anglais"
        icon={<Sparkles className="h-4 w-4 text-edu-600" />}
      >
        <form onSubmit={handleChatSubmit} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Commande TALN Formations"
              value={chatCommand}
              onChange={(event) => setChatCommand(event.target.value)}
              placeholder="Ex. Créer une formation nommée Python"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={isChatExecuting || !chatCommand.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-edu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-edu-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isChatExecuting ? 'animate-spin' : ''}`} />
              {isChatExecuting ? 'Traitement…' : 'Exécuter'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Exemples :</span>
            {[
              'Lister les formations',
              'Créer une formation nommée Python',
              'Modifier le prix de Formation Java à 900',
              'Supprimer la formation Python',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setChatCommand(example)}
                className="rounded border border-transparent bg-slate-100 px-2 py-1 text-[11px] text-slate-600 transition hover:border-edu-200 hover:bg-edu-50 hover:text-edu-700"
              >
                {example}
              </button>
            ))}
          </div>
          {chatFeedback && (
            <div
              role="status"
              className={`flex flex-col gap-2 rounded-lg border p-3 text-xs sm:flex-row sm:items-start sm:justify-between ${
                chatFeedback.success
                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                  : 'border-amber-200 bg-amber-50/80 text-amber-900'
              }`}
            >
              <div>
                <span className="mr-2 rounded bg-white/70 px-1.5 py-0.5 font-semibold uppercase">{chatFeedback.action}</span>
                <span className="font-medium">{chatFeedback.message}</span>
              </div>
              {chatFeedback.sparql && (
                <details className="shrink-0">
                  <summary className="flex cursor-pointer list-none items-center gap-1 font-semibold hover:underline">
                    <Code2 className="h-3.5 w-3.5" /> Voir SPARQL
                  </summary>
                  <pre className="mt-2 max-h-40 max-w-full overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-3 text-[10px] text-slate-100 sm:max-w-lg">
                    {chatFeedback.sparql}
                  </pre>
                </details>
              )}
            </div>
          )}
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Formations affichées" icon={<BookOpen className="h-4 w-4" />}>
          <p className="text-2xl font-bold text-slate-900">{isLoading ? '—' : formations.length}</p>
          <p className="mt-1 text-xs text-slate-500">Résultats correspondant aux filtres</p>
        </Card>
        <Card title="Classes disponibles" icon={<BookOpen className="h-4 w-4" />}>
          <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
          <p className="mt-1 text-xs text-slate-500">Classes dans la branche Formation</p>
        </Card>
        <Card title="Source des données" icon={<RefreshCw className="h-4 w-4" />}>
          <p className="text-sm font-semibold text-slate-900">API EduSmart</p>
          <p className="mt-1 text-xs text-slate-500">Les opérations passent par le backend SPARQL</p>
        </Card>
      </div>

      <Card
        title="Catalogue des formations"
        subtitle="Recherchez par nom ou filtrez par classe ontologique."
        icon={<Search className="h-4 w-4" />}
        actions={
          <button
            type="button"
            onClick={() => reloadData(appliedSearch, appliedClass)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        }
      >
        <form onSubmit={handleSearch} className="mb-5 flex flex-col items-end gap-3 md:flex-row">
          <div className="w-full flex-1">
            <label htmlFor="formation-search" className={labelClass}>Nom / identifiant</label>
            <input
              id="formation-search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Ex. Formation Java"
              className={inputClass}
            />
          </div>
          <div className="w-full md:w-64">
            <label htmlFor="formation-class-filter" className={labelClass}>Classe</label>
            <select
              id="formation-class-filter"
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className={inputClass}
            >
              <option value="">Toutes les classes</option>
              <option value="Formation">Formation</option>
              {classes.map((item) => (
                <option key={item.class_name} value={item.class_name}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <button type="submit" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-edu-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-edu-700 md:flex-initial">
              <Search className="h-3.5 w-3.5" /> Filtrer
            </button>
            <button type="button" onClick={handleReset} className="rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
              Réinitialiser
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th scope="col" className="px-3 py-3 font-semibold">Formation</th>
                <th scope="col" className="px-3 py-3 font-semibold">Classe</th>
                <th scope="col" className="px-3 py-3 font-semibold">Durée</th>
                <th scope="col" className="px-3 py-3 font-semibold">Prix</th>
                <th scope="col" className="px-3 py-3 font-semibold">Domaine / Modalité</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                  <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> Chargement des formations…
                </td></tr>
              ) : formations.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center">
                  <BookOpen className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Aucune formation trouvée</p>
                  <p className="mt-1 text-xs text-slate-400">Essayez de modifier les filtres ou créez une formation.</p>
                </td></tr>
              ) : formations.map((formation) => (
                <tr key={formation.uri} className="align-top hover:bg-slate-50/70">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-800">{formation.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">{formation.id}</p>
                    {formation.description && <p className="mt-1 max-w-sm text-xs text-slate-500">{formation.description}</p>}
                  </td>
                  <td className="px-3 py-3"><Badge variant="blue" size="sm">{formation.class_name}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">
                    {formation.duration != null ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-slate-400" />{formation.duration}</span> : '—'}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {formation.price ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    <div>{formation.domain || 'Domaine non renseigné'}</div>
                    <div className="mt-1 text-slate-400">{formation.modality || 'Modalité non renseignée'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" aria-label={`Modifier ${formation.label}`} onClick={() => openEdit(formation)} className="rounded-md p-2 text-slate-500 hover:bg-edu-50 hover:text-edu-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label={`Supprimer ${formation.label}`} onClick={() => setDeleteTarget(formation)} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {formMode && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSubmitting) setFormMode(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="formation-form-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="formation-form-title" className="font-semibold text-slate-900">{formMode === 'create' ? 'Nouvelle formation' : 'Modifier la formation'}</h2>
                <p className="mt-1 text-xs text-slate-500">Les champs de domaine et modalité attendent un identifiant RDF local.</p>
              </div>
              <button type="button" aria-label="Fermer" onClick={() => setFormMode(null)} disabled={isSubmitting} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-5">
              {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                {formMode === 'create' && (
                  <div>
                    <label htmlFor="formation-id" className={labelClass}>Identifiant (facultatif)</label>
                    <input id="formation-id" value={form.id} onChange={(event) => updateForm('id', event.target.value)} placeholder="Généré depuis le nom" className={inputClass} />
                  </div>
                )}
                <div className={formMode === 'edit' ? 'sm:col-span-2' : ''}>
                  <label htmlFor="formation-label" className={labelClass}>Nom *</label>
                  <input id="formation-label" required minLength={2} value={form.label} onChange={(event) => updateForm('label', event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="formation-class" className={labelClass}>Classe ontologique</label>
                  <select id="formation-class" value={form.class_name} onChange={(event) => updateForm('class_name', event.target.value)} className={inputClass}>
                    <option value="Formation">Formation</option>
                    {classes.map((item) => <option key={item.class_name} value={item.class_name}>{item.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="formation-duration" className={labelClass}>Durée</label>
                  <input id="formation-duration" type="number" min="0" step="any" value={form.duration} onChange={(event) => updateForm('duration', event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="formation-price" className={labelClass}>Prix</label>
                  <input id="formation-price" type="number" min="0" step="any" value={form.price} onChange={(event) => updateForm('price', event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="formation-domain" className={labelClass}>Domaine (identifiant RDF)</label>
                  <input id="formation-domain" value={form.domain} onChange={(event) => updateForm('domain', event.target.value)} placeholder="Ex. Informatique_Formation" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="formation-modality" className={labelClass}>Modalité (identifiant RDF)</label>
                  <input id="formation-modality" value={form.modality} onChange={(event) => updateForm('modality', event.target.value)} placeholder="Ex. Hybride" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="formation-objective" className={labelClass}>Objectif</label>
                  <textarea id="formation-objective" rows={2} value={form.objective} onChange={(event) => updateForm('objective', event.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="formation-description" className={labelClass}>Description</label>
                  <textarea id="formation-description" rows={3} value={form.description} onChange={(event) => updateForm('description', event.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" disabled={isSubmitting} onClick={() => setFormMode(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-edu-600 px-4 py-2 text-xs font-semibold text-white hover:bg-edu-700 disabled:opacity-60">
                  {isSubmitting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                  {formMode === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="formation-delete-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 id="formation-delete-title" className="font-semibold text-slate-900">Supprimer cette formation ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              « {deleteTarget.label} » ({deleteTarget.id}) sera supprimée du graphe, avec ses relations entrantes et sortantes.
            </p>
            {error && <div role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={isSubmitting} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Annuler</button>
              <button type="button" disabled={isSubmitting} onClick={() => void handleDelete()} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
                {isSubmitting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} Supprimer
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
