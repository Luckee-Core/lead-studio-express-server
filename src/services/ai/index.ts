// Export Anthropic client (primary AI service)
export {
  createManagedAnthropicClient,
  createBYOKAnthropicClient,
  getManagedAnthropicClient,
  generateCompletion,
  generateChatCompletion,
  parseAIResponse,
  type AnthropicCredentials,
  type ChatCompletionMessage,
  type ChatCompletionOptions,
  type CompletionOptions,
} from './anthropic-client';

// Keep OpenAI exports for backward compatibility (if needed later)
export {
  createManagedOpenAIClient,
  createBYOKOpenAIClient,
  getManagedOpenAIClient,
  type OpenAICredentials,
} from './openai-client';
