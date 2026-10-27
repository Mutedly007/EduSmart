/**
 * EduSmart Frontend TypeScript Type Definitions
 */

export interface ServiceStatus {
  name: string;
  status: 'online' | 'standby' | 'ready_for_ingestion' | 'standby_no_file' | 'unconfigured' | 'offline';
  details: string;
}

export interface BackendHealth {
  status: 'healthy' | 'degraded' | 'offline';
  version: string;
  environment: string;
  timestamp: string;
  services: Record<string, ServiceStatus>;
}

export interface AppInfo {
  app_name: string;
  version: string;
  description: string;
  docs_url: string;
  redoc_url: string;
  semantic_engine: string;
  nlp_engine: string;
  status: string;
}

export interface NavItem {
  id: string;
  title: string;
  path: string;
  iconName: string;
  description: string;
  badge?: string;
  isPhase1Ready?: boolean;
}
