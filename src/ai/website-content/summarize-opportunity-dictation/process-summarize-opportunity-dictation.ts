import Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildSummarizeOpportunityDictationPrompt } from './build-prompt';
import { parseSummarizeOpportunityDictationResponse } from './parse-response';
import type {
  SummarizeOpportunityDictationRequest,
  SummarizeOpportunityDictationResult,
} from './types';

export const processSummarizeOpportunityDictation = async (
  anthropic: Anthropic,
  request: SummarizeOpportunityDictationRequest
): Promise<SummarizeOpportunityDictationResult> => {
  const { systemPrompt, userMessage } = buildSummarizeOpportunityDictationPrompt(request);
  const { model, temperature, maxTokens } = getModelConfig('lead_opportunity_dictation');

  try {
    const completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model,
      temperature,
      maxTokens,
    });
    const parsed = parseSummarizeOpportunityDictationResponse(completion.response);
    return {
      ...parsed,
      model,
      rawResponse: completion.response,
      usage: completion.usage,
      prompts: { systemPrompt, userMessage },
    };
  } catch (error) {
    return {
      success: false,
      summary: '',
      opportunities: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model,
      prompts: { systemPrompt, userMessage },
    };
  }
};
