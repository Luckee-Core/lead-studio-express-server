import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLeadContactById } from '../../data/lead-contacts/get-by-id';
import { getLeadById } from '../../data/leads/get-by-id';
import {
  countLeadSentEmailsForContact,
  listSentEmailsWithPlainBodiesForLeadContact,
} from '../../data/lead-sent-emails';
import { listColdEmailOfferingsForUser } from '../../data/cold-email-offering/list-for-user';
import {
  buildLeadContactFollowUpEmailDraftSystemPrompt,
  buildLeadContactFollowUpEmailDraftUserPayload,
  formatPriorOutboundsBlock,
} from './buildLeadContactFollowUpEmailDraftPrompt';
import { loadLeadContactChatTranscriptForUser } from './loadLeadContactChatTranscriptForUser';
import {
  runLeadContactEmailDraftGeneration,
  type GenerateLeadContactEmailDraftResult,
} from './runLeadContactEmailDraftGeneration';

const followUpTemplateStepFromPriorSendCount = (
  priorSendCount: number,
): 1 | 2 | 3 => {
  return Math.min(priorSendCount, 3) as 1 | 2 | 3;
};

/**
 * Follow-up email draft only. Call when the user explicitly requests a follow-up.
 * Requires at least one row in `lead_sent_emails` for this contact.
 */
export const processGenerateLeadContactFollowUpEmailDraft = async (
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

  const priorSendCount = await countLeadSentEmailsForContact(
    supabase,
    leadContactId,
  );
  if (priorSendCount < 1) {
    throw new Error(
      'NO_PRIOR_SENDS: No sent emails for this contact; use the intro draft flow instead.',
    );
  }

  const offeringRows = await listColdEmailOfferingsForUser(supabase, userId);
  const offeredServices = offeringRows.map((row) => ({
    title: row.title?.trim() || 'Untitled offering',
    hook: (row.hook ?? '').trim(),
    description: (row.description ?? '').trim(),
  }));

  const chatTranscript = await loadLeadContactChatTranscriptForUser(
    supabase,
    leadContactId,
    userId,
  );

  const priorPlainBodies = await listSentEmailsWithPlainBodiesForLeadContact(
    supabase,
    leadContactId,
    5,
  );

  if (!anthropic) {
    throw new Error('AI is not configured');
  }

  const followUpTemplateStep = followUpTemplateStepFromPriorSendCount(priorSendCount);
  const systemPrompt =
    buildLeadContactFollowUpEmailDraftSystemPrompt(followUpTemplateStep);

  const userPayload = buildLeadContactFollowUpEmailDraftUserPayload({
    lead,
    contactName: contact.name,
    contactRole: contact.role,
    contactEmail: contact.email,
    chatTranscript,
    emailPersona,
    offeredServices,
    priorOutboundsBlock: formatPriorOutboundsBlock(priorPlainBodies),
  });

  const messageType = 'lead_contact_email_followup_draft' as const;

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
      flow: 'follow_up',
      leadContactId,
      personaKeyCount: Object.keys(emailPersona).length,
      priorSendCount,
      followUpTemplateStep,
      sequenceStepIndex: priorSendCount,
    },
  });
};
