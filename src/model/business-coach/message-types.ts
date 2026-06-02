/**
 * Message Type Base Types
 * 
 * Generic types used across all message types (conversational, strategic, clarifying, brainstorm)
 * Following the 3-table pattern: Request, Exchange, Response
 */

export type MessageTypeRequest = {
  id: string;
  user_id: string;
  content: string;
  persona_id: string | null;
  exchange_id?: string | null;
  response_id?: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

export type MessageTypeExchange = {
  id: string;
  user_id: string;
  request_id: string;
  response_id: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  credits_used: number;
  tokens_per_credit: number;
  model_used: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

export type MessageTypeResponse = {
  id: string;
  structured: any; // Use any to match existing RawMentorResponse structure
  is_data_deep_dive: boolean; // Copied from classification
  created_at: string;
  updated_at: string;
};

