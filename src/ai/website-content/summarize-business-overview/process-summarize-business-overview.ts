import Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildSummarizeBusinessOverviewPrompt } from './build-prompt';
import { parseSummarizeBusinessOverviewResponse } from './parse-response';
import type {
  SummarizeBusinessOverviewRequest,
  SummarizeBusinessOverviewResult,
} from './types';

/**
 * Run model: short owner-facing blurb (`description` / quick_take) plus structured arrays for `leads.summary`.
 */
export const processSummarizeBusinessOverview = async (
  anthropic: Anthropic,
  request: SummarizeBusinessOverviewRequest
): Promise<SummarizeBusinessOverviewResult> => {
  const { systemPrompt, userMessage } = buildSummarizeBusinessOverviewPrompt(request);
  const { model, temperature, maxTokens } = getModelConfig('website_business_overview');

  try {
    const completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model,
      temperature,
      maxTokens,
    });
    const parsed = parseSummarizeBusinessOverviewResponse(completion.response);
    return {
      ...parsed,
      model,
      rawResponse: completion.response,
      usage: completion.usage,
      prompts: {
        systemPrompt,
        userMessage,
      },
    };
  } catch (error) {
    return {
      success: false,
      description: null,
      facts: {},
      concerns: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model,
      prompts: {
        systemPrompt,
        userMessage,
      },
    };
  }
};
