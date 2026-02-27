export interface App {
  id: string;
  name: string;
  region: string;
  status: 'idle' | 'running' | 'deploying';
  created_at: string;
  updated_at: string;
}

export interface ConfigVar {
  id: number;
  app_id: string;
  key: string;
  value: string;
}

export interface Release {
  id: number;
  app_id: string;
  version: number;
  description: string;
  status: string;
  created_at: string;
}

export interface Addon {
  id: string;
  app_id: string;
  name: string;
  plan: string;
  status: string;
}

export interface AddonCatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export interface ActivityEvent {
  id: number;
  app_id: string;
  app_name?: string;
  actor: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface LogEntry {
  appId: string;
  source: string;
  content: string;
  timestamp: string;
}
