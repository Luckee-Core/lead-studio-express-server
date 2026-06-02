import Anthropic from '@anthropic-ai/sdk';
import { getModelConfig } from '../../../services/ai/model-config';

export interface AICallResult {
  responseText: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  modelUsed: string;
}

/**
 * Call Anthropic API with configured model
 * 
 * Uses getModelConfig to dynamically select model, temperature, and maxTokens
 * based on message type.
 * 
 * @param anthropic - Anthropic client
 * @param messageType - Type of message (determines model config)
 * @param systemPrompt - System prompt
 * @param userMessage - User's message
 * @returns AI response with token counts
 * @throws Error if AI call fails
 * 
 * @example
 * const result = await callAI(
 *   anthropic, 
 *   'strategic', 
 *   'You are a business coach...', 
 *   'How do I scale?'
 * );
 * console.log(result.responseText, result.totalTokens);
 */
export const callAI = async (
  anthropic: Anthropic,
  messageType: string,
  systemPrompt: string,
  userMessage: string
): Promise<AICallResult> => {
  
  const modelConfig = getModelConfig(messageType);
  
  console.log(`🤖 Calling ${modelConfig.model} (temp: ${modelConfig.temperature})...`);
  
  const response = await anthropic.messages.create({
    model: modelConfig.model,
    max_tokens: modelConfig.maxTokens,
    temperature: modelConfig.temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
  
  console.log(`✅ AI responded (${response.usage.input_tokens + response.usage.output_tokens} tokens)`);
  
  return {
    responseText,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    modelUsed: modelConfig.model,
  };
};

