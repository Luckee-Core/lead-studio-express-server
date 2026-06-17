import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../../db/supabase-client';
import {
  getLeadOpportunityDictationRequestById,
  getLeadOpportunityDictationResponseById,
} from '../../data/lead-opportunity-dictation';
import { updateLeadOpportunitySuggestionAfterOfferingCreated } from '../../data/lead-opportunity-suggestions';
import { createColdEmailOffering } from '../../data/cold-email-offering/create';
import { listColdEmailOfferingsForUser } from '../../data/cold-email-offering/list-for-user';
import { verifyCronSecret } from '../lead-research-shared';

type SuggestionRow = {
  id: string;
  title: string;
  description: string;
  reason: string;
  matchType: 'existing' | 'new';
  matchedServiceId: string | null;
  matchedServiceTitle: string | null;
};

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const asSuggestions = (value: unknown): SuggestionRow[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item): SuggestionRow => ({
      id: typeof item.id === 'string' ? item.id : '',
      title: typeof item.title === 'string' ? item.title : '',
      description: typeof item.description === 'string' ? item.description : '',
      reason: typeof item.reason === 'string' ? item.reason : '',
      matchType: item.matchType === 'existing' ? 'existing' : 'new',
      matchedServiceId: typeof item.matchedServiceId === 'string' ? item.matchedServiceId : null,
      matchedServiceTitle:
        typeof item.matchedServiceTitle === 'string' ? item.matchedServiceTitle : null,
    }))
    .filter((item): item is SuggestionRow => !!item.id && !!item.title && !!item.description);
};

export const runLeadOpportunityDictationApply = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const body = req.body as {
    leadId?: string;
    requestId?: string;
    suggestionIds?: string[];
  } | undefined;
  const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  const suggestionIds = Array.isArray(body?.suggestionIds) ? body?.suggestionIds : [];

  if (!leadId || !requestId || suggestionIds.length === 0) {
    res.status(400).json({
      success: false,
      error: 'leadId, requestId, and suggestionIds are required',
    });
    return;
  }

  const supabase = getSupabaseClient();

  try {
    const requestRow = await getLeadOpportunityDictationRequestById(supabase, requestId);
    if (!requestRow) {
      res.status(404).json({ success: false, error: 'Opportunity request not found' });
      return;
    }
    if (requestRow.lead_id !== leadId) {
      res.status(400).json({ success: false, error: 'Request is not tied to this lead' });
      return;
    }
    if (!requestRow.response_id) {
      res.status(400).json({ success: false, error: 'Request has no AI response to apply' });
      return;
    }

    const responseRow = await getLeadOpportunityDictationResponseById(
      supabase,
      requestRow.response_id
    );
    if (!responseRow) {
      res.status(404).json({ success: false, error: 'Opportunity response not found' });
      return;
    }

    const suggestions = asSuggestions(
      (responseRow.structured as { suggestions?: unknown }).suggestions
    );
    const selected = suggestions.filter(
      (item) => suggestionIds.includes(item.id) && item.matchType === 'new'
    );

    if (selected.length === 0) {
      res.status(200).json({ success: true, createdOfferings: [] });
      return;
    }

    const existing = await listColdEmailOfferingsForUser(supabase, requestRow.user_id);
    const existingByTitle = new Set(existing.map((service) => normalize(service.title)));
    let nextSortOrder = existing.reduce(
      (max, service) => Math.max(max, service.sort_order),
      0
    );

    const createdOfferings: {
      id: string;
      title: string;
      hook: string;
      description: string;
      sortOrder: number;
      createdAt: string;
      updatedAt: string;
    }[] = [];

    for (const item of selected) {
      const normalizedTitle = normalize(item.title);
      if (!normalizedTitle || existingByTitle.has(normalizedTitle)) {
        continue;
      }

      nextSortOrder += 1;
      const created = await createColdEmailOffering(supabase, {
        id: uuidv4(),
        userId: requestRow.user_id,
        title: item.title.trim(),
        hook: item.title.trim(),
        description: item.description.trim(),
        sortOrder: nextSortOrder,
      });
      existingByTitle.add(normalizedTitle);
      createdOfferings.push({
        id: created.id,
        title: created.title,
        hook: created.hook,
        description: created.description,
        sortOrder: created.sort_order,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      });

      await updateLeadOpportunitySuggestionAfterOfferingCreated(supabase, {
        dictationRequestId: requestId,
        sourceSuggestionId: item.id,
        coldEmailOfferingId: created.id,
      });
    }

    res.status(200).json({
      success: true,
      createdOfferings,
      createdServices: createdOfferings,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadOpportunityDictationApply:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
