/**
 * Chat Message Types
 * Ephemeral display layer (72hr TTL)
 */

export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  user_id: string;
  domain: string;
  role: ChatMessageRole;
  content: any; // User message as string, AI response as structured JSON
  exchange_id?: string; // Link to permanent mentor_exchanges record
  created_at: string;
  updated_at: string;
};

export type CreateChatMessageInput = {
  user_id: string;
  domain: string;
  role: ChatMessageRole;
  content: any;
  exchange_id?: string;
};

