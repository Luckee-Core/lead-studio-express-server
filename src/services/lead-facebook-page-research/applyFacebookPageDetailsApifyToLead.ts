import type { SupabaseClient } from '@supabase/supabase-js';
import { getLeadById } from '../../data/leads/get-by-id';
import { updateLead } from '../../data/leads/update';
import { createLeadContact, getLeadContactsByLeadId } from '../../data/lead-contacts';
import { updateLeadContact } from '../../data/lead-contacts/update';
import { runFacebookPageDetailsScraper } from '../../domains/facebook-page-details/run';
import {
  buildLeadEmailUpdatesFromFacebookScrape,
  buildLeadPhoneUpdatesFromFacebookScrape,
  extractEmailFromApifyFacebookPageItem,
  extractFacebookPageContactName,
  extractPhoneFromApifyFacebookPageItem,
} from '../../utils/facebook';
import { findLeadContactDuplicateForReachOut } from '../../utils/lead-contacts';

const digitsOnly = (value: string): string => value.replace(/\D/g, '');

export type ApplyFacebookPageDetailsApifyToLeadResult = {
  success: boolean;
  error?: string;
  /** True when a new `lead_contacts` row was inserted. */
  contactCreated?: boolean;
  /** True when an existing row was updated (e.g. email added to phone-only website contact). */
  contactMerged?: boolean;
  leadEmailUpdated?: boolean;
  leadPhoneUpdated?: boolean;
  /** First dataset item from Apify (for persistence / debugging). */
  data: unknown;
};

/**
 * Runs Apify Facebook Pages Scraper for `profileUrl`, updates lead email/phone when found,
 * and creates a lead contact when not a duplicate of existing rows.
 */
export const applyFacebookPageDetailsApifyToLead = async (
  supabase: SupabaseClient,
  leadId: string,
  profileUrl: string
): Promise<ApplyFacebookPageDetailsApifyToLeadResult> => {
  const lead = await getLeadById(supabase, leadId);
  if (!lead) {
    return { success: false, error: 'Lead not found', data: null };
  }

  const result = await runFacebookPageDetailsScraper({ profileUrl });
  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Facebook page scraper failed',
      data: result.data ?? null,
    };
  }

  const data = result.data;
  const scrapedEmail = extractEmailFromApifyFacebookPageItem(data);
  const scrapedPhone = extractPhoneFromApifyFacebookPageItem(data);

  const emailUpdates =
    scrapedEmail && lead ? buildLeadEmailUpdatesFromFacebookScrape(lead, scrapedEmail) : null;
  let leadEmailUpdated = false;
  if (emailUpdates) {
    try {
      await updateLead(supabase, leadId, emailUpdates);
      leadEmailUpdated = true;
      console.log(`✅ Lead email updated from Facebook scrape leadId=${leadId}`);
    } catch (emailErr: unknown) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error('⚠️ Failed to update lead email from Facebook scrape:', msg);
    }
  }

  const phoneUpdates =
    scrapedPhone && lead ? buildLeadPhoneUpdatesFromFacebookScrape(lead, scrapedPhone) : null;
  let leadPhoneUpdated = false;
  if (phoneUpdates) {
    try {
      await updateLead(supabase, leadId, phoneUpdates);
      leadPhoneUpdated = true;
      console.log(`✅ Lead phone updated from Facebook scrape leadId=${leadId}`);
    } catch (phoneErr: unknown) {
      const msg = phoneErr instanceof Error ? phoneErr.message : String(phoneErr);
      console.error('⚠️ Failed to update lead phone from Facebook scrape:', msg);
    }
  }

  const refreshed = await getLeadById(supabase, leadId);
  const leadForContact = refreshed ?? lead;

  const emailForContact =
    scrapedEmail ??
    emailUpdates?.email?.trim() ??
    emailUpdates?.business_email?.trim() ??
    leadForContact.email?.trim() ??
    leadForContact.business_email?.trim() ??
    null;
  const phoneForContact =
    scrapedPhone ??
    phoneUpdates?.business_phone?.trim() ??
    phoneUpdates?.phone?.trim() ??
    leadForContact.business_phone?.trim() ??
    leadForContact.phone?.trim() ??
    null;

  let contactMerged = false;
  if (scrapedEmail || scrapedPhone) {
    try {
      const contactsList = await getLeadContactsByLeadId(supabase, leadId);
      const emailNorm = scrapedEmail?.trim().toLowerCase() ?? '';
      const phoneDigits = scrapedPhone ? digitsOnly(scrapedPhone) : '';

      for (const c of contactsList) {
        const exPhone = c.phone?.trim() ? digitsOnly(c.phone) : '';
        const exEmail = c.email?.trim().toLowerCase() ?? '';

        const samePhone =
          phoneDigits.length >= 7 && exPhone.length >= 7 && exPhone === phoneDigits;
        const sameEmail = Boolean(emailNorm && exEmail && exEmail === emailNorm);

        if (samePhone && scrapedEmail && !c.email?.trim()) {
          await updateLeadContact(supabase, c.id, { email: scrapedEmail });
          contactMerged = true;
          console.log(`✅ Lead contact merged email from Facebook scrape leadId=${leadId}`);
          break;
        }
        if (sameEmail && scrapedPhone && !c.phone?.trim()) {
          await updateLeadContact(supabase, c.id, { phone: scrapedPhone });
          contactMerged = true;
          console.log(`✅ Lead contact merged phone from Facebook scrape leadId=${leadId}`);
          break;
        }
      }
    } catch (mergeErr: unknown) {
      const msg = mergeErr instanceof Error ? mergeErr.message : String(mergeErr);
      console.error('⚠️ Failed to merge Facebook into existing contact:', msg);
    }
  }

  if (contactMerged) {
    return {
      success: true,
      contactCreated: false,
      contactMerged: true,
      leadEmailUpdated,
      leadPhoneUpdated,
      data,
    };
  }

  let contactCreated = false;
  if (emailForContact || phoneForContact) {
    try {
      const contacts = await getLeadContactsByLeadId(supabase, leadId);
      const isDup = findLeadContactDuplicateForReachOut(
        contacts,
        emailForContact,
        phoneForContact
      );
      if (!isDup) {
        const contactName = extractFacebookPageContactName(data, leadForContact.business_name);
        await createLeadContact(supabase, {
          lead_id: leadId,
          name: contactName,
          email: emailForContact ?? undefined,
          phone: phoneForContact ?? undefined,
          role: 'Founder',
          notes: 'Auto-created from Facebook page scrape',
        });
        contactCreated = true;
        console.log(`✅ Lead contact created from Facebook scrape leadId=${leadId}`);
      }
    } catch (contactErr: unknown) {
      const msg = contactErr instanceof Error ? contactErr.message : String(contactErr);
      console.error('⚠️ Failed to create lead contact from Facebook scrape:', msg);
    }
  }

  return {
    success: true,
    contactCreated,
    contactMerged: false,
    leadEmailUpdated,
    leadPhoneUpdated,
    data,
  };
};
