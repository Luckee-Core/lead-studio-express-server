import Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildResolveSerpProfilesPrompt } from './build-prompt';
import { parseResolveSerpProfilesResponse } from './parse-response';
import { ResolveSerpProfilesRequest, ResolveSerpProfilesResponse } from './types';

/**
 * Run Haiku to map SERP rows to social/review URLs.
 */
export const processResolveSerpProfiles = async (
  anthropic: Anthropic,
  request: ResolveSerpProfilesRequest
): Promise<ResolveSerpProfilesResponse> => {
  const { systemPrompt, userMessage } = buildResolveSerpProfilesPrompt(request);
  const { model, temperature, maxTokens } = getModelConfig('serp_profile_resolution');

  try {
    const completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model,
      temperature,
      maxTokens,
    });
    const parsed = parseResolveSerpProfilesResponse(completion.response);
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
      profiles: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model,
      prompts: {
        systemPrompt,
        userMessage,
      },
    };
  }
};
