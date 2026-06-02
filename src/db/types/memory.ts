/**
 * Memory Layer Types
 * Types for the AI context memory system
 */

import { FactCategoryName } from '../../domains/business-coach/shared/categories';

export type MemoryFactCategory = FactCategoryName;

export type MemoryFact = {
  id: string;
  user_id: string;
  domain: string; // 'global', 'business-coach', 'pot-notes', 'bitit', 'spotter'
  categories: MemoryFactCategory[]; // Array of categories: ['finance', 'sales', 'strategy']
  fact_key: string;
  fact_value: string;
  confidence: number; // 0-1
  source_type: 'explicit' | 'inferred';
  source_exchange_id?: string;
  customer_id?: string; // Links fact to a specific customer (null = about user)
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
};

export type MemoryEvent = {
  id: string;
  user_id: string;
  domain: string;
  event_type: string;
  event_data: Record<string, any>;
  event_summary?: string;
  occurred_at: string;
  source_exchange_id?: string;
  created_at: string;
};

export type ContextSummary = {
  id: string;
  user_id: string;
  domain: string;
  summary_type: 'daily' | 'weekly' | 'all_time' | 'session';
  summary_text: string;
  key_points?: Record<string, any>;
  valid_from: string;
  valid_until?: string;
  generated_at: string;
  tokens_used?: number;
  created_at: string;
};

export type AgentConfig = {
  id: string;
  user_id: string;
  domain: string;
  system_prompt_overrides?: Record<string, any>;
  temperature: number;
  memory_window_size: number;
  include_facts: boolean;
  include_events: boolean;
  include_summaries: boolean;
  created_at: string;
  updated_at: string;
};

