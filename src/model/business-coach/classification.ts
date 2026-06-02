/**
 * Classification Types
 * 
 * Types for message classification (determining if message is conversational, strategic, etc.)
 */

export type ClassificationRequest = {
  id: string;
  user_id: string;
  content: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

export type ClassificationExchange = {
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

export type ClassificationResponse = {
  id: string;
  structured: {
    type: 'conversational' | 'strategic' | 'clarifying' | 'brainstorm';
    confidence: number;
    isDataDeepDive: boolean; // True if user is asking about their stored data
  };
  created_at: string;
  updated_at: string;
};

export type MessageType = 'conversational' | 'strategic' | 'clarifying' | 'brainstorm';

export type ClassificationResult = {
  request: ClassificationRequest;
  exchange: ClassificationExchange;
  response: ClassificationResponse;
  messageType: MessageType;
};

