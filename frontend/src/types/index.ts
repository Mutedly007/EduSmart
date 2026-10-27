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

export interface GraphStats {
  dataset: string;
  engine: string;
  status: string;
  triples_count: number;
  classes_count: number;
  individuals_count: number;
  object_properties_count: number;
  datatype_properties_count: number;
  endpoint_url: string;
}

export interface SparqlQueryResponse {
  success: boolean;
  query: string;
  source: string;
  results?: any;
  records?: Record<string, any>[];
  total_records: number;
  execution_time_ms: number;
  error?: string | null;
}

export interface OntologyClassItem {
  uri: string;
  name: string;
  label?: string | null;
  parent_uri?: string | null;
  parent_name?: string | null;
  subclasses_count: number;
  instances_count: number;
}

export interface OntologyClassesResponse {
  total_classes: number;
  root_branches: string[];
  classes: OntologyClassItem[];
}

export interface OntologyIndividualItem {
  uri: string;
  name: string;
  types: string[];
  label?: string | null;
  properties: Record<string, any>;
}

export interface PropertyAssertion {
  property_uri: string;
  property_name: string;
  property_type: 'object' | 'datatype';
  value: any;
  label?: string | null;
}

export interface OntologyIndividualDetail {
  uri: string;
  name: string;
  types: string[];
  attributes: Record<string, any>;
  relationships: PropertyAssertion[];
  incoming_relations: PropertyAssertion[];
}

export interface ExtractedEntity {
  text: string;
  entity_type: string;
  matched_uri?: string | null;
  matched_name?: string | null;
}

export interface NlpQueryResponse {
  success: boolean;
  question: string;
  language: string;
  intent: string;
  entities: ExtractedEntity[];
  sparql_query: string;
  explanation: string;
  records?: Record<string, any>[];
  total_records: number;
  execution_source?: string;
  processing_time_ms: number;
  error?: string | null;
}

export interface SampleQuestion {
  category: string;
  language: string;
  question: string;
  description: string;
}

export interface PersonneItem {
  id: string;
  uri: string;
  label: string;
  class_name: string;
  email?: string | null;
  telephone?: string | null;
  grade?: string | null;
  specialite?: string | null;
  statut?: string | null;
}

export interface PersonneCreate {
  id?: string;
  label: string;
  class_name: string;
  email?: string;
  telephone?: string;
  grade?: string;
  specialite?: string;
}

export interface PersonneClassItem {
  class_name: string;
  label: string;
}

export interface PersonneCommandResponse {
  success: boolean;
  action: string;
  message: string;
  sparql?: string | null;
  affected_id?: string | null;
  records?: Record<string, any>[] | null;
}

export interface CompetenceItem {
  id: string;
  uri: string;
  label: string;
  class_name: string;
  category?: string | null;
  description?: string | null;
  niveau?: string | null;
  langue?: string | null;
  prerequis_pour: string[];
  developpee_par: string[];
  acquise_par: string[];
}

export interface CompetenceCreate {
  id?: string;
  label: string;
  class_name: string;
  description?: string;
  niveau?: string;
  langue?: string;
}

export interface CompetenceClassItem {
  class_name: string;
  label: string;
  category?: string | null;
  parent?: string | null;
}

export interface CompetenceCommandResponse {
  success: boolean;
  action: string;
  message: string;
  sparql?: string | null;
  affected_id?: string | null;
  records?: Record<string, any>[] | null;
}

export interface EtablissementRelationItem {
  id: string;
  uri: string;
  label: string;
  type_name?: string | null;
}

export interface EtablissementItem {
  id: string;
  uri: string;
  label: string;
  class_name: string;
  ville?: string | null;
  adresse?: string | null;
  site_web?: string | null;
  telephone?: string | null;
  email?: string | null;
  statut?: string | null;
  description?: string | null;
  mode_enseignement?: string | null;
  domaine?: string | null;
  formations_organisees: EtablissementRelationItem[];
  programmes_proposes: EtablissementRelationItem[];
  etudiants_inscrits: EtablissementRelationItem[];
  enseignants_affilies: EtablissementRelationItem[];
}

export interface EtablissementCreate {
  id?: string;
  label: string;
  class_name: string;
  ville?: string;
  adresse?: string;
  site_web?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  description?: string;
  mode_enseignement?: string;
  domaine?: string;
}

export interface EtablissementUpdate {
  label?: string;
  class_name?: string;
  ville?: string;
  adresse?: string;
  site_web?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  description?: string;
  mode_enseignement?: string;
  domaine?: string;
}

export interface EtablissementClassItem {
  class_name: string;
  label: string;
  category?: string | null;
  parent?: string | null;
}

export interface EtablissementCommandResponse {
  success: boolean;
  action: string;
  message: string;
  sparql?: string | null;
  affected_id?: string | null;
  records?: Record<string, any>[] | null;
}
