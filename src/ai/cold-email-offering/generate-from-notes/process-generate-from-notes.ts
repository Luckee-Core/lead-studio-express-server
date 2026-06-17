import Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildGenerateColdEmailOfferingFromNotesPrompt } from './build-prompt';
import { parseGenerateColdEmailOfferingFromNotesResponse } from './parse-response';
import type {
  GenerateColdEmailOfferingFromNotesRequest,
  GenerateColdEmailOfferingFromNotesResult,
} from './types';

/**
 * Turn freeform notes into a structured cold email offering via Claude.
 */
export const processGenerateColdEmailOfferingFromNotes = async (
  anthropic: Anthropic,
  request: GenerateColdEmailOfferingFromNotesRequest,
): Promise<GenerateColdEmailOfferingFromNotesResult> => {
  const { systemPrompt, userMessage } = buildGenerateColdEmailOfferingFromNotesPrompt(request);
  const { model, temperature, maxTokens } = getModelConfig('cold_email_offering_generate');

  try {
    const completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model,
      temperature,
      maxTokens,
    });
    const parsed = parseGenerateColdEmailOfferingFromNotesResponse(completion.response);
    return {
      ...parsed,
      model,
      rawResponse: completion.response,
    };
  } catch (error) {
    return {
      success: false,
      title: null,
      hook: null,
      description: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model,
    };
  }
};
