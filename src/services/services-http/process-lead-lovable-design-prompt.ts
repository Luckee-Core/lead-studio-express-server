import type Anthropic from '@anthropic-ai/sdk';
import type { LeadLovableContext } from '../../data/leads/get-lead-lovable-context-by-id';
import { getModelConfig } from '../ai/model-config';

export type ProcessLeadLovableDesignPromptInput = {
  notes: string;
  leadContext: LeadLovableContext | null;
};

export type ProcessLeadLovableDesignPromptResult =
  | { success: true; prompt: string }
  | { success: false; error: string };

const SYSTEM_PROMPT = `You write a single paste-ready prompt for Lovable (or similar AI site builders).
The user builds a marketing website for a LOCAL SERVICE BUSINESS.

Requirements for the prompt you output:
- The site must include these pages/sections: Home, Services, Portfolio, Contact.
- Tone, value propositions, and CTAs must reflect the user's business notes and any CRM context provided.
- Output plain text only: one cohesive prompt the user can paste into Lovable. No markdown code fences, no preamble like "Here is your prompt".
- Ask the builder to use a professional, trustworthy, mobile-first layout appropriate for local services.
- Mention navigation linking Home, Services, Portfolio, and Contact clearly.`;

const buildUserContent = (input: ProcessLeadLovableDesignPromptInput): string => {
  const parts: string[] = ['Business notes from dictation:', input.notes.trim()];

  if (input.leadContext) {
    const { businessName, name, description, address, website } = input.leadContext;
    const lines = [
      businessName && `Business name: ${businessName}`,
      name && `Contact / lead name: ${name}`,
      description && `Existing description: ${description}`,
      address && `Location: ${address}`,
      website && `Website: ${website}`,
    ].filter(Boolean);
    if (lines.length > 0) {
      parts.push('', 'Additional context from CRM:', ...lines.map((l) => `- ${l}`));
    }
  }

  return parts.join('\n');
};

/**
 * Calls Anthropic to produce one Lovable-ready site prompt from dictation + optional lead row.
 */
export const processLeadLovableDesignPrompt = async (
  anthropic: Anthropic,
  input: ProcessLeadLovableDesignPromptInput
): Promise<ProcessLeadLovableDesignPromptResult> => {
  const { model: defaultModel, temperature, maxTokens } = getModelConfig('lead_lovable_design_prompt');
  const model = process.env.ANTHROPIC_MODEL?.trim() || defaultModel;
  const userContent = buildUserContent(input);

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const first = response.content[0];
    if (!first || first.type !== 'text' || !first.text?.trim()) {
      return { success: false, error: 'Empty model response' };
    }

    return { success: true, prompt: first.text.trim() };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI request failed';
    console.error('❌ [processLeadLovableDesignPrompt]', message);
    return { success: false, error: message };
  }
};
