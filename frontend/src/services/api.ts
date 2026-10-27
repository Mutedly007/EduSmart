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

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const api = new ApiClient(API_BASE_URL);
