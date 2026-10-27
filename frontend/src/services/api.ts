/**
 * EduSmart Native Fetch API Client
 * Facilitates JSON communication with the FastAPI backend.
 */

import type { AppInfo, BackendHealth } from '../types';

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
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

  /**
   * Fetch backend root metadata
   */
  async getAppInfo(): Promise<AppInfo> {
    return this.request<AppInfo>('/');
  }

  /**
   * Perform backend health check
   */
  async checkHealth(): Promise<BackendHealth> {
    return this.request<BackendHealth>('/health');
  }

  /**
   * Get the configured API base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const api = new ApiClient(API_BASE_URL);
