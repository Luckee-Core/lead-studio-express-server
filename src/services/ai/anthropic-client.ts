import Anthropic from '@anthropic-ai/sdk';
import { Request } from 'express';

export type AnthropicCredentials = {
  apiKey: string;
};

export type CompletionOptions = {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export type ChatCompletionMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatCompletionOptions = {
  systemPrompt: string;
  messages: ChatCompletionMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

// Singleton for managed client
let managedClient: Anthropic | null = null;

/**
 * Strip whitespace and optional wrapping quotes from API keys.
 * Hosted env pastes (Railway/Vercel) often include trailing newlines or stray quotes, which Anthropic rejects with 401.
 */
const normalizeAnthropicApiKey = (raw: string | undefined): string | undefined => {
  if (raw === undefined || raw === null) return undefined;
  let key = String(raw).trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  return key.length > 0 ? key : undefined;
};

/**
 * Get or create the managed Anthropic client (hosted mode)
 */
export const getManagedAnthropicClient = (): Anthropic | null => {
  if (managedClient) return managedClient;

  const apiKey = normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY);

  if (!apiKey) {
    console.warn('Managed Anthropic not configured');
    return null;
  }

  managedClient = new Anthropic({ apiKey });
  return managedClient;
};

/**
 * Create managed Anthropic client (hosted mode)
 */
export const createManagedAnthropicClient = (): Anthropic => {
  const client = getManagedAnthropicClient();
  if (!client) {
    throw new Error('Managed Anthropic not configured');
  }
  return client;
};

/**
 * Create BYOK Anthropic client (user's own key)
 */
export const createBYOKAnthropicClient = (credentials: AnthropicCredentials): Anthropic => {
  return new Anthropic({ apiKey: credentials.apiKey });
};

/**
 * Create Anthropic client with support for hosted and BYOK modes
 */
export const createAnthropicClient = (req?: Request): Anthropic => {
  // Check if user is providing their own Anthropic key (BYOK mode)
  const headerRaw = req?.headers['x-user-anthropic-key'];
  const userAnthropicKey = normalizeAnthropicApiKey(
    typeof headerRaw === 'string' ? headerRaw : Array.isArray(headerRaw) ? headerRaw[0] : undefined,
  );

  if (userAnthropicKey) {
    // BYOK mode - use user's API key
    return createBYOKAnthropicClient({ apiKey: userAnthropicKey });
  }

  // Hosted mode - use our API key
  return createManagedAnthropicClient();
};

/**
 * Generate completion with Anthropic Claude
 */
export const generateCompletion = async (
  client: Anthropic,
  options: CompletionOptions
): Promise<{ response: string; usage: { input_tokens: number; output_tokens: number } }> => {
  const {
    systemPrompt,
    userMessage,
    model = 'claude-opus-4-20250514',
    temperature = 0.7,
    maxTokens = 4000,
  } = options;

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  // Extract text content from response
  const textContent = message.content.find((block) => block.type === 'text');
  const response = textContent && textContent.type === 'text' ? textContent.text : '{}';

  const usage = {
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  };

  return { response, usage };
};

/**
 * Multi-turn chat completion (user/assistant alternation, must start with user).
 */
export const generateChatCompletion = async (
  client: Anthropic,
  options: ChatCompletionOptions
): Promise<{ response: string; usage: { input_tokens: number; output_tokens: number } }> => {
  const {
    systemPrompt,
    messages,
    model = 'claude-opus-4-20250514',
    temperature = 0.7,
    maxTokens = 4000,
  } = options;

  const anthropicMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  const textContent = message.content.find((block) => block.type === 'text');
  const response = textContent && textContent.type === 'text' ? textContent.text : '';

  return {
    response,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
    },
  };
};

/**
 * Parse AI response (expects JSON format)
 */
export const parseAIResponse = (response: string): any => {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    return null;
  }
};

