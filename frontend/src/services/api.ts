/**
 * EduSmart Native Fetch API Client
 * Facilitates JSON communication with the FastAPI backend for SPARQL, Ontology, and TALN.
 */

import type {
  AppInfo,
  BackendHealth,
  GraphStats,
  OntologyClassesResponse,
  OntologyIndividualDetail,
  OntologyIndividualItem,
  NlpQueryResponse,
  SampleQuestion,
  SparqlQueryResponse,
  PersonneItem,
  PersonneCreate,
  PersonneClassItem,
  PersonneCommandResponse,
  CompetenceItem,
  CompetenceCreate,
  CompetenceClassItem,
  CompetenceCommandResponse,
  ApprentissageItem,
  ApprentissageCreate,
  ApprentissageClassItem,
  ApprentissageCommandResponse,
  FormationItem,
  FormationCreate,
  FormationUpdate,
  FormationClassItem,
  FormationCommandResponse,
  EtablissementItem,
  EtablissementCreate,
  EtablissementUpdate,
  EtablissementClassItem,
  EtablissementCommandResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Generic request wrapper around native fetch with error handling and timeout.
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail = errorData?.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(detail);
      }

      return await response.json();
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out connecting to backend API');
        }
        throw err;
      }
      throw new Error('An unknown error occurred during API request');
    }
  }

  // --- Health & System ---
  async getAppInfo(): Promise<AppInfo> {
    return this.request<AppInfo>('/');
  }

  async checkHealth(): Promise<BackendHealth> {
    return this.request<BackendHealth>('/health');
  }

  // --- SPARQL Engine ---
  async getGraphStats(): Promise<GraphStats> {
    return this.request<GraphStats>('/api/sparql/stats');
  }

  async executeSparql(query: string): Promise<SparqlQueryResponse> {
    return this.request<SparqlQueryResponse>('/api/sparql/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // --- Ontology Navigation ---
  async getOntologyClasses(): Promise<OntologyClassesResponse> {
    return this.request<OntologyClassesResponse>('/api/ontology/classes');
  }

  async getOntologyIndividuals(className?: string): Promise<{ total: number; individuals: OntologyIndividualItem[] }> {
    const queryParam = className ? `?class_name=${encodeURIComponent(className)}` : '';
    return this.request<{ total: number; individuals: OntologyIndividualItem[] }>(`/api/ontology/individuals${queryParam}`);
  }

  async getIndividualDetail(name: string): Promise<OntologyIndividualDetail> {
    return this.request<OntologyIndividualDetail>(`/api/ontology/individuals/${encodeURIComponent(name)}`);
  }

  // --- TALN / NLP Engine ---
  async askNlpQuestion(question: string, execute = true): Promise<NlpQueryResponse> {
    return this.request<NlpQueryResponse>('/api/nlp/query', {
      method: 'POST',
      body: JSON.stringify({ question, execute }),
    });
  }

  async getSampleQuestions(lang?: string): Promise<SampleQuestion[]> {
    const queryParam = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return this.request<SampleQuestion[]>(`/api/nlp/sample-questions${queryParam}`);
  }

  // --- Personnes CRUD & TALN ---
  async getPersonnes(params?: { name?: string; class_name?: string }): Promise<PersonneItem[]> {
    const query = new URLSearchParams();
    if (params?.name) query.set('name', params.name);
    if (params?.class_name) query.set('class_name', params.class_name);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PersonneItem[]>(`/api/personnes${qs}`);
  }

  async getPersonneClasses(): Promise<PersonneClassItem[]> {
    return this.request<PersonneClassItem[]>('/api/personnes/classes');
  }

  async createPersonne(data: PersonneCreate): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>('/api/personnes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePersonne(id: string, data: Partial<PersonneCreate>): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/personnes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePersonne(id: string): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/personnes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async executePersonneChat(command: string): Promise<PersonneCommandResponse> {
    return this.request<PersonneCommandResponse>('/api/personnes/chat', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  // --- Compétences CRUD & TALN ---
  async getCompetences(params?: {
    name?: string;
    class_name?: string;
    niveau?: string;
    category?: string;
  }): Promise<CompetenceItem[]> {
    const query = new URLSearchParams();
    if (params?.name) query.set('name', params.name);
    if (params?.class_name) query.set('class_name', params.class_name);
    if (params?.niveau) query.set('niveau', params.niveau);
    if (params?.category) query.set('category', params.category);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<CompetenceItem[]>(`/api/competences${qs}`);
  }

  async getCompetenceClasses(): Promise<CompetenceClassItem[]> {
    return this.request<CompetenceClassItem[]>('/api/competences/classes');
  }

  async createCompetence(data: CompetenceCreate): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>('/api/competences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompetence(id: string, data: Partial<CompetenceCreate>): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/competences/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCompetence(id: string): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/competences/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async executeCompetenceChat(command: string): Promise<CompetenceCommandResponse> {
    return this.request<CompetenceCommandResponse>('/api/competences/chat', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  // --- Apprentissage CRUD & TALN ---
  async getApprentissages(params?: {
    name?: string;
    class_name?: string;
    category?: string;
    modalite?: string;
  }): Promise<ApprentissageItem[]> {
    const query = new URLSearchParams();
    if (params?.name) query.set('name', params.name);
    if (params?.class_name) query.set('class_name', params.class_name);
    if (params?.category) query.set('category', params.category);
    if (params?.modalite) query.set('modalite', params.modalite);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<ApprentissageItem[]>(`/api/apprentissage${qs}`);
  }

  async getApprentissageClasses(): Promise<ApprentissageClassItem[]> {
    return this.request<ApprentissageClassItem[]>('/api/apprentissage/classes');
  }

  async createApprentissage(data: ApprentissageCreate): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>('/api/apprentissage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApprentissage(id: string, data: Partial<ApprentissageCreate>): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/apprentissage/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApprentissage(id: string): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/apprentissage/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async executeApprentissageChat(command: string): Promise<ApprentissageCommandResponse> {
    return this.request<ApprentissageCommandResponse>('/api/apprentissage/chat', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  // --- Formation CRUD & TALN ---
  async getFormations(params?: { name?: string; class_name?: string }): Promise<FormationItem[]> {
    const query = new URLSearchParams();
    if (params?.name) query.set('name', params.name);
    if (params?.class_name) query.set('class_name', params.class_name);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<FormationItem[]>(`/api/formations${qs}`);
  }

  async getFormationClasses(): Promise<FormationClassItem[]> {
    return this.request<FormationClassItem[]>('/api/formations/classes');
  }

  async createFormation(data: FormationCreate): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>('/api/formations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFormation(id: string, data: FormationUpdate): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/formations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFormation(id: string): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/formations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async executeFormationCommand(command: string): Promise<FormationCommandResponse> {
    return this.request<FormationCommandResponse>('/api/formations/chat', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  // --- Établissements CRUD & TALN ---
  async getEtablissements(params?: {
    name?: string;
    class_name?: string;
    ville?: string;
    statut?: string;
  }): Promise<EtablissementItem[]> {
    const query = new URLSearchParams();
    if (params?.name) query.set('name', params.name);
    if (params?.class_name) query.set('class_name', params.class_name);
    if (params?.ville) query.set('ville', params.ville);
    if (params?.statut) query.set('statut', params.statut);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<EtablissementItem[]>(`/api/etablissements${qs}`);
  }

  async getEtablissementClasses(): Promise<EtablissementClassItem[]> {
    return this.request<EtablissementClassItem[]>('/api/etablissements/classes');
  }

  async getEtablissement(id: string): Promise<EtablissementItem> {
    return this.request<EtablissementItem>(`/api/etablissements/${encodeURIComponent(id)}`);
  }

  async exportEtablissementTurtle(id: string): Promise<string> {
    const url = `${this.baseUrl}/api/etablissements/${encodeURIComponent(id)}/turtle`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to export Turtle`);
    return await res.text();
  }

  async createEtablissement(data: EtablissementCreate): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>('/api/etablissements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEtablissement(id: string, data: EtablissementUpdate): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/etablissements/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEtablissement(id: string): Promise<{ success: boolean; id: string; sparql: string; message: string }> {
    return this.request<{ success: boolean; id: string; sparql: string; message: string }>(`/api/etablissements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async executeEtablissementChat(command: string): Promise<EtablissementCommandResponse> {
    return this.request<EtablissementCommandResponse>('/api/etablissements/chat', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  async addStudentToEtablissement(establishmentId: string, studentId: string): Promise<{ success: boolean; message: string; sparql: string }> {
    return this.request<{ success: boolean; message: string; sparql: string }>(`/api/etablissements/${encodeURIComponent(establishmentId)}/students`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
    });
  }

  async removeStudentFromEtablissement(establishmentId: string, studentId: string): Promise<{ success: boolean; message: string; sparql: string }> {
    return this.request<{ success: boolean; message: string; sparql: string }>(`/api/etablissements/${encodeURIComponent(establishmentId)}/students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
    });
  }


  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const api = new ApiClient(API_BASE_URL);
