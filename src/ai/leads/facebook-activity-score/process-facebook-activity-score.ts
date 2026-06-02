import type Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildFacebookActivityScorePrompt } from './build-prompt';
import { parseFacebookActivityScoreResponse } from './parse-response';
import type { FacebookActivityScoreInput, FacebookActivityScoreResult } from './types';

export type ProcessFacebookActivityScoreResponse =
  | {
      success: true;
      data: FacebookActivityScoreResult;
      model: string;
      prompts: { systemPrompt: string; userMessage: string };
      rawResponse: string;
      usage: { input_tokens: number; output_tokens: number };
    }
  | {
      success: false;
      model: string;
      prompts: { systemPrompt: string; userMessage: string };
      error: string;
      rawResponse?: string;
      usage?: { input_tokens: number; output_tokens: number };
    };

/**
 * Calls Claude to produce a 0–100 Facebook posting activity score from normalized posts.
 * Always returns model and prompts; includes rawResponse and usage when the API call completes.
 */
export const processFacebookActivityScore = async (
  anthropic: Anthropic,
  input: FacebookActivityScoreInput,
): Promise<ProcessFacebookActivityScoreResponse> => {
  const modelConfig = getModelConfig('facebook_activity_score');
  const { systemPrompt, userMessage } = buildFacebookActivityScorePrompt(input);
  const model = modelConfig.model;
  const prompts = { systemPrompt, userMessage };

  let responseText: string;
  let usage: { input_tokens: number; output_tokens: number };
  try {
    const completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    });
    responseText = completion.response;
    usage = completion.usage;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message, model, prompts };
  }

  const parsed = parseFacebookActivityScoreResponse(responseText);
  if (!parsed.ok) {
    return {
      success: false,
      error: parsed.error,
      model,
      prompts,
      rawResponse: responseText,
      usage,
    };
  }

  return {
    success: true,
    data: parsed.data,
    model,
    prompts,
    rawResponse: responseText,
    usage,
  };
};
