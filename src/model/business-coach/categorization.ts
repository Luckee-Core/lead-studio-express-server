/**
 * Category Extraction Types
 * 
 * Types for extracting relevant fact categories from user messages
 */

import { FactCategoryName } from '../../domains/business-coach/shared/categories';

export type CategoryExtractionRequest = {
  id: string;
  user_id: string;
  content: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

export type CategoryExtractionExchange = {
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

export type CategoryExtractionResponse = {
  id: string;
  structured: {
    categories: FactCategoryName[];
    reasoning: string;
  };
  created_at: string;
  updated_at: string;
};

export type CategoryExtractionResult = {
  request: CategoryExtractionRequest;
  exchange: CategoryExtractionExchange;
  response: CategoryExtractionResponse;
  categories: FactCategoryName[];
};
