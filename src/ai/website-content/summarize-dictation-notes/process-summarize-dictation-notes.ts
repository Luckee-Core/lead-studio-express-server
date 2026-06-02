import Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildSummarizeDictationNotesPrompt } from './build-prompt';
import { parseSummarizeDictationNotesResponse } from './parse-response';
import type {
  SummarizeDictationNotesRequest,
  SummarizeDictationNotesResult,
} from './types';

export const processSummarizeDictationNotes = async (
  anthropic: Anthropic,
  request: SummarizeDictationNotesRequest
): Promise<SummarizeDictationNotesResult> => {
  const { systemPrompt, userMessage } = buildSummarizeDictationNotesPrompt(request);
  const { model, temperature, maxTokens } = getModelConfig('lead_dictation_notes_overview');

  try {
    const completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model,
      temperature,
      maxTokens,
    });
    const parsed = parseSummarizeDictationNotesResponse(completion.response);
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
      description: null,
      facts: {},
      concerns: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      model,
      prompts: { systemPrompt, userMessage },
    };
  }
};
