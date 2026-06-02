import Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildResolveSinglePlatformSerpPrompt } from './build-prompt';
import { parseResolveSinglePlatformSerpResponse } from './parse-response';
import type { ResolveSinglePlatformSerpRequest, ResolveSinglePlatformSerpResponse } from './types';

/**
 * Run Haiku to pick one profile URL for facebook | instagram | linkedin from SERP rows.
 */
export const processResolveSinglePlatformSerp = async (
  anthropic: Anthropic,
  request: ResolveSinglePlatformSerpRequest
): Promise<ResolveSinglePlatformSerpResponse> => {
  const { systemPrompt, userMessage } = buildResolveSinglePlatformSerpPrompt(request);
  const { model, temperature, maxTokens } = getModelConfig('serp_profile_resolution');

  try {
    const completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model,
      temperature,
      maxTokens,
    });
    const parsed = parseResolveSinglePlatformSerpResponse(completion.response, request.platform);
    return {
      ...parsed,
      rawResponse: completion.response,
      model,
      usage: completion.usage,
      prompts: {
        systemPrompt,
        userMessage,
      },
    };
  } catch (error) {
    return {
      success: false,
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model,
      prompts: {
        systemPrompt,
        userMessage,
      },
    };
  }
};
