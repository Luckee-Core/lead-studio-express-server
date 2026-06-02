import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getLeadById } from '../../data/leads/get-by-id';
import { updateLead } from '../../data/leads/update';
import {
  createLeadDictationNotesAiExchange,
  createLeadDictationNotesAiRequest,
  createLeadDictationNotesAiResponse,
} from '../../data/lead-dictation-notes-ai';
import { buildLeadSummaryFromWebsiteOverviewAi } from '../../ai/website-content/summarize-business-overview/build-lead-summary-payload';
import { processSummarizeDictationNotes } from '../../ai/website-content/summarize-dictation-notes/process-summarize-dictation-notes';
import { getManagedAnthropicClient } from '../ai/anthropic-client';
import { verifyCronSecret } from '../lead-research-shared';

const getLeadIdFromBody = (req: Request): string | null => {
  const body = req.body;
  if (!body || typeof body !== 'object') return null;
  const id = (body as { leadId?: unknown }).leadId;
  if (typeof id !== 'string') return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getDictationNotesFromBody = (req: Request): string | null => {
  const body = req.body;
  if (!body || typeof body !== 'object') return null;
  const notes = (body as { notes?: unknown }).notes;
  if (typeof notes !== 'string') return null;
  const trimmed = notes.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * POST /api/services/lead-dictation-notes-research
 * Body: { leadId: string, notes: string }
 */
export const runLeadDictationNotesResearch = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const leadId = getLeadIdFromBody(req);
  const notes = getDictationNotesFromBody(req);
  if (!leadId || !notes) {
    res.status(400).json({ success: false, error: 'leadId and notes are required' });
    return;
  }

  const supabase = getSupabaseClient();
  const anthropic = getManagedAnthropicClient();
  if (!anthropic) {
    res.status(503).json({ success: false, error: 'Anthropic client not configured' });
    return;
  }

  try {
    const lead = await getLeadById(supabase, leadId);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    const ai = await processSummarizeDictationNotes(anthropic, {
      businessName: lead.business_name,
      address: lead.address ?? null,
      notes,
    });

    const aiRequest = await createLeadDictationNotesAiRequest(supabase, {
      leadId: lead.id,
      model: ai.model || 'unknown',
      requestPayloadJson: {
        businessName: lead.business_name,
        address: lead.address ?? null,
        notesLength: notes.length,
      },
      systemPrompt: ai.prompts?.systemPrompt || '',
      userMessage: ai.prompts?.userMessage || '',
    });

    const parsedJson =
      ai.success && ai.description
        ? {
            quick_take: ai.description,
            facts: ai.facts,
            concerns: ai.concerns,
          }
        : null;

    const aiResponse = await createLeadDictationNotesAiResponse(supabase, {
      requestId: aiRequest.id,
      model: ai.model || 'unknown',
      status: ai.success ? 'success' : 'error',
      rawResponse: ai.rawResponse || null,
      parsedResponseJson: parsedJson,
      errorMessage: ai.error || null,
      usageInputTokens: ai.usage?.input_tokens ?? null,
      usageOutputTokens: ai.usage?.output_tokens ?? null,
    });

    const exchange = await createLeadDictationNotesAiExchange(supabase, {
      leadId: lead.id,
      requestId: aiRequest.id,
      responseId: aiResponse.id,
    });

    if (!ai.success || !ai.description) {
      res.status(200).json({
        success: false,
        error: ai.error || 'AI summarization failed',
        aiAudit: {
          requestId: aiRequest.id,
          responseId: aiResponse.id,
          exchangeId: exchange.id,
        },
      });
      return;
    }

    const summary = buildLeadSummaryFromWebsiteOverviewAi(ai, 0);
    summary.source_data.notes_count = 1;
    summary.source_data.scrapes_count = 0;

    await updateLead(supabase, lead.id, {
      description: ai.description.trim(),
      summary,
    });

    res.status(200).json({
      success: true,
      leadId: lead.id,
      leadUpdated: true,
      aiAudit: {
        requestId: aiRequest.id,
        responseId: aiResponse.id,
        exchangeId: exchange.id,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadDictationNotesResearch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
