import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLeadContactById } from '../../data/lead-contacts/get-by-id';
import { getLeadById } from '../../data/leads/get-by-id';
import { listOfferedServicesForUser } from '../../data/offered-service/list-for-user';
import {
  buildLeadContactEmailDraftSystemPrompt,
  buildLeadContactEmailDraftUserPayload,
} from './buildLeadContactEmailDraftPrompt';
import { loadLeadContactChatTranscriptForUser } from './loadLeadContactChatTranscriptForUser';
import {
  runLeadContactEmailDraftGeneration,
  type GenerateLeadContactEmailDraftResult,
} from './runLeadContactEmailDraftGeneration';

/**
 * First-touch / intro email draft only. Does not inspect sent history.
 */
export const processGenerateLeadContactIntroEmailDraft = async (
  supabase: SupabaseClient,
  anthropic: Anthropic | null,
  userId: string,
  leadContactId: string,
  emailPersona: Record<string, string>,
): Promise<GenerateLeadContactEmailDraftResult> => {
  const contact = await getLeadContactById(supabase, leadContactId);
  if (!contact) {
    throw new Error('Lead contact not found');
  }

  const lead = await getLeadById(supabase, contact.lead_id);
  if (!lead) {
    throw new Error('Lead not found for contact');
  }

  const offeredServiceRows = await listOfferedServicesForUser(supabase, userId);
  const offeredServices = offeredServiceRows.map((row) => ({
    title: row.title?.trim() || 'Untitled service',
    description: (row.description ?? '').trim(),
  }));

  const chatTranscript = await loadLeadContactChatTranscriptForUser(
    supabase,
    leadContactId,
    userId,
  );

  if (!anthropic) {
    throw new Error('AI is not configured');
  }

  const systemPrompt = buildLeadContactEmailDraftSystemPrompt();
  const userPayload = buildLeadContactEmailDraftUserPayload({
    lead,
    contactName: contact.name,
    contactRole: contact.role,
    contactEmail: contact.email,
    chatTranscript,
    emailPersona,
    offeredServices,
  });

  const messageType = 'lead_contact_email_draft' as const;

  return runLeadContactEmailDraftGeneration({
    supabase,
    anthropic,
    userId,
    leadContactId,
    leadId: contact.lead_id,
    emailPersona,
    systemPrompt,
    userPayload,
    messageType,
    requestPayloadJson: {
      kind: 'lead_contact_email_draft',
      flow: 'intro',
      leadContactId,
      personaKeyCount: Object.keys(emailPersona).length,
    },
  });
};
