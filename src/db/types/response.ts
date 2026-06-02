/**
 * Unified AI Response Types
 * Shared response structure across all domains
 */

export type AIResponse = {
  structured: ResponseSection[];
};

export type ResponseSection = {
  header: string;
  summary?: string;
  type?: 'email' | 'direct-message' | 'summary' | 'list';
  body: ResponseBodyItem[];
};

export type ResponseBodyItem = {
  id: string;
  type: 'paragraph' | 'list' | 'plan' | 'subheader';
  content?: string;
  items?: ListItem[] | PlanItem[];
};

export type ListItem = {
  id: string;
  text: string;
};

export type PlanItem = {
  id: string;
  title: string;
  details: ListItem[];
};

/**
 * Base Exchange Type
 * Common fields across all domain exchanges
 */
export type BaseExchange = {
  id: string;
  user_id: string;
  user_message: string;
  ai_response: AIResponse;
  credits_used: number;
  total_tokens_used: number;
  status: 'idle' | 'pending' | 'completed' | 'failed';
  type: 'original' | 'follow-up';
  parent_exchange_id?: string;
  created_at: string;
  updated_at: string;
};

