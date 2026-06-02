/**
 * Fact Extraction Types
 * 
 * For extracting memory facts from user conversations
 */

export type FactExtractionExchange = {
  id: string;
  user_id: string;
  source_exchange_id: string;
  source_exchange_type: 'strategic' | 'brainstorm';
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  credits_used: number;
  tokens_per_credit: number;
  model_used: string;
  facts_created: number;
  facts_updated: number;
  facts_removed: number;
  status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

