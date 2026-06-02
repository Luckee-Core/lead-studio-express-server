import OpenAI from 'openai';
import { Request } from 'express';

export type OpenAICredentials = {
  apiKey: string;
};

export type CompletionOptions = {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  temperature?: number;
};

// Singleton for managed client
let managedClient: OpenAI | null = null;

/**
 * Get or create the managed OpenAI client (hosted mode)
 */
export const getManagedOpenAIClient = (): OpenAI | null => {
  if (managedClient) return managedClient;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('Managed OpenAI not configured');
    return null;
  }

  managedClient = new OpenAI({ apiKey });
  return managedClient;
};

/**
 * Create managed OpenAI client (hosted mode)
 */
export const createManagedOpenAIClient = (): OpenAI => {
  const client = getManagedOpenAIClient();
  if (!client) {
    throw new Error('Managed OpenAI not configured');
  }
  return client;
};

/**
 * Create BYOK OpenAI client (user's own key)
 */
export const createBYOKOpenAIClient = (credentials: OpenAICredentials): OpenAI => {
  return new OpenAI({ apiKey: credentials.apiKey });
};

/**
 * Create OpenAI client with support for hosted and BYOK modes
 */
export const createOpenAIClient = (req?: Request): OpenAI => {
  // Check if user is providing their own OpenAI key (BYOK mode)
  const userOpenAIKey = req?.headers['x-user-openai-key'] as string;

  if (userOpenAIKey) {
    // BYOK mode - use user's API key
    return createBYOKOpenAIClient({ apiKey: userOpenAIKey });
  }

  // Hosted mode - use our API key
  return createManagedOpenAIClient();
};

/**
 * Generate completion with OpenAI
 */
export const generateCompletion = async (
  client: OpenAI,
  options: CompletionOptions
): Promise<{ response: string; usage: { input_tokens: number; output_tokens: number } }> => {
  return createChatCompletion(client, options);
};

/**
 * Call OpenAI with structured JSON response
 */
export const createChatCompletion = async (
  client: OpenAI,
  params: CompletionOptions
): Promise<{ response: string; usage: { input_tokens: number; output_tokens: number } }> => {
  const {
    systemPrompt,
    userMessage,
    model = 'gpt-4o',
    temperature = 0.7,
  } = params;

  const completion = await client.chat.completions.create({
    model,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const response = completion.choices[0]?.message?.content || '{}';
  const usage = {
    input_tokens: completion.usage?.prompt_tokens || 0,
    output_tokens: completion.usage?.completion_tokens || 0,
  };

  return { response, usage };
};

