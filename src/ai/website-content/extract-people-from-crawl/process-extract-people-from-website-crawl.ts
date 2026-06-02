import Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildExtractPeopleFromWebsiteCrawlPrompt } from './build-prompt';
import { parseExtractPeopleFromWebsiteCrawlResponse } from './parse-response';
import type {
  ExtractPeopleFromWebsiteCrawlRequest,
  ExtractPeopleFromWebsiteCrawlResult,
} from './types';

/**
 * Claude: named people + email/phone from website crawl markdown (JSON).
 */
export const processExtractPeopleFromWebsiteCrawl = async (
  anthropic: Anthropic,
  request: ExtractPeopleFromWebsiteCrawlRequest
): Promise<ExtractPeopleFromWebsiteCrawlResult> => {
  const { systemPrompt, userMessage } = buildExtractPeopleFromWebsiteCrawlPrompt(request);
  const { model, temperature, maxTokens } = getModelConfig('website_extract_people');

  try {
    const completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model,
      temperature,
      maxTokens,
    });
    const parsed = parseExtractPeopleFromWebsiteCrawlResponse(
      completion.response,
      request.businessName
    );
    if (!parsed.success) {
      return {
        success: false,
        contacts: [],
        error: parsed.error,
        model,
        rawResponse: completion.response,
        usage: completion.usage,
        prompts: { systemPrompt, userMessage },
      };
    }
    return {
      success: true,
      contacts: parsed.contacts,
      model,
      rawResponse: completion.response,
      usage: completion.usage,
      prompts: { systemPrompt, userMessage },
    };
  } catch (error) {
    return {
      success: false,
      contacts: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model,
      prompts: { systemPrompt, userMessage },
    };
  }
};
