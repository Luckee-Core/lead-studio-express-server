/**
 * Generate email content from campaign variations (or fallback template).
 * Creates a lead_contact_email record and returns it with metadata for sending.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createLeadContactEmail } from '../../data/lead-contact-emails/create';
import type { LeadContactEmail } from '../../data/lead-contact-emails/get-all';
import { pickRandomTemplate } from '../../data/lead-contact-emails/email-templates';
import { pickRandomSenderName } from '../../data/lead-contact-emails/sender-names';
import { textToTiptapContent } from '../../data/lead-contact-emails/text-to-tiptap';
import { pickRandomCampaignEmailVariation } from '../../data/campaign-email-variations';

export type GenerateCampaignVariationEmailInput = {
  lead_id: string;
  lead_contact_id: string;
  campaign_id?: string | null;
  campaign_ids?: string[];
};

export type GenerateCampaignVariationEmailResult = {
  email: LeadContactEmail;
  fromName: string;
  variationId: number | undefined;
  campaignEmailVariationId: string | undefined;
};

export const generateCampaignVariationEmail = async (
  supabase: SupabaseClient,
  input: GenerateCampaignVariationEmailInput
): Promise<GenerateCampaignVariationEmailResult> => {
  const fromName = pickRandomSenderName();
  let subject: string;
  let body: ReturnType<typeof textToTiptapContent>;
  let variationId: number | undefined = undefined;
  let campaignEmailVariationId: string | undefined = undefined;

  if (input.campaign_id) {
    const variation = await pickRandomCampaignEmailVariation(supabase, input.campaign_id);
    if (variation) {
      subject = variation.subject;
      body = variation.body as ReturnType<typeof textToTiptapContent>;
      campaignEmailVariationId = variation.id;
    } else {
      const template = pickRandomTemplate();
      subject = template.subject;
      body = textToTiptapContent(template.body);
      variationId = template.variationId;
    }
  } else {
    const template = pickRandomTemplate();
    subject = template.subject;
    body = textToTiptapContent(template.body);
    variationId = template.variationId;
  }

  const email = await createLeadContactEmail(supabase, {
    lead_id: input.lead_id,
    lead_contact_id: input.lead_contact_id,
    subject,
    body,
    campaign_ids: input.campaign_ids ?? [],
    variation_id: variationId ?? undefined,
  });

  return { email, fromName, variationId, campaignEmailVariationId };
};
