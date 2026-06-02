import type Anthropic from '@anthropic-ai/sdk';
import { generateCompletion } from '../../../services/ai';
import { getModelConfig } from '../../../services/ai/model-config';
import { buildBatchAutoCategorizePrompt } from './build-prompt';
import { parseBatchAutoCategorizeResponse } from './parse-response';
import type { BatchAutoCategorizeCategoryInput, BatchAutoCategorizeLeadInput } from './types';

const BATCH_MAX_TOKENS = 2048;

export type ProcessBatchAutoCategorizeResult = {
  success: boolean;
  assignments: { leadId: string; categoryId: string | null }[];
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  error?: string;
};

/**
 * Call Claude to categorize up to 10 leads into existing categories or null.
 */
export const processBatchAutoCategorize = async (
  anthropic: Anthropic,
  input: {
    categories: BatchAutoCategorizeCategoryInput[];
    leads: BatchAutoCategorizeLeadInput[];
  }
): Promise<ProcessBatchAutoCategorizeResult> => {
  const modelConfig = getModelConfig('categorization');
  const { systemPrompt, userMessage } = buildBatchAutoCategorizePrompt(input);

  let completion: { response: string; usage: { input_tokens: number; output_tokens: number } };
  try {
    completion = await generateCompletion(anthropic, {
      systemPrompt,
      userMessage,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxTokens: Math.max(modelConfig.maxTokens, BATCH_MAX_TOKENS),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      assignments: [],
      model: modelConfig.model,
      usage: { input_tokens: 0, output_tokens: 0 },
      error: message,
    };
  }

  const parsed = parseBatchAutoCategorizeResponse(completion.response);
  if (!parsed.ok) {
    return {
      success: false,
      assignments: [],
      model: modelConfig.model,
      usage: completion.usage,
      error: parsed.error,
    };
  }

  return {
    success: true,
    assignments: parsed.data.assignments,
    model: modelConfig.model,
    usage: completion.usage,
  };
};
