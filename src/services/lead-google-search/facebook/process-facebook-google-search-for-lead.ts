import type { SupabaseClient } from '@supabase/supabase-js';
import { getLeadById } from '../../../data/leads/get-by-id';
import { getLeadContactsByLeadId } from '../../../data/lead-contacts';
import { updateLead } from '../../../data/leads/update';
import {
  createActiveFacebookGoogleSearch,
  type FacebookGoogleSearchRequestSource,
  finalizeFacebookGoogleSearch,
  getLatestLeadsTableFacebookGoogleSearchForLead,
} from '../../../data/facebook-google-search';
import { applyFacebookPageDetailsApifyToLead } from '../../lead-facebook-page-research/applyFacebookPageDetailsApifyToLead';
import { hasAnyLeadContactWithEmailAndPhone } from '../../../utils/lead-contacts';
import { runFacebookSerpDiscovery, runFacebookSerpResolution } from './process';

export type ProcessFacebookGoogleSearchForLeadSuccess = {
  leadId: string;
  runId: string;
  platform: string;
  linkCount: number;
  hasProfiles: boolean;
  leadUpdated: boolean;
  websiteUrls: string[];
  resolveSerpPrompts: unknown;
  facebookApifySkipped?: string;
  facebookApifyError?: string;
  facebookContactCreated: boolean;
  facebookContactMerged: boolean;
  /** True when this lead already used the leads-table Facebook action (`request_source = leads_table`). */
  skippedDuplicate?: boolean;
};

const buildSuccessFromPriorPayload = (
  leadId: string,
  runId: string,
  payload: Record<string, unknown> | null
): ProcessFacebookGoogleSearchForLeadSuccess => {
  const p = payload ?? {};
  const serpLinks = Array.isArray(p.serpLinks) ? p.serpLinks : [];
  const resolvedUrl = p.resolvedUrl;
  const profileUrl = p.profileUrl;
  return {
    leadId,
    runId,
    platform: typeof p.platform === 'string' ? p.platform : 'facebook',
    linkCount: serpLinks.length,
    hasProfiles: Boolean(
      (typeof resolvedUrl === 'string' && resolvedUrl.trim()) ||
        (typeof profileUrl === 'string' && profileUrl.trim())
    ),
    leadUpdated: Boolean(p.leadUpdated),
    websiteUrls: [],
    resolveSerpPrompts: null,
    facebookApifySkipped:
      typeof p.facebookApifySkipped === 'string' ? p.facebookApifySkipped : undefined,
    facebookApifyError:
      typeof p.facebookApifyError === 'string' ? p.facebookApifyError : undefined,
    facebookContactCreated: Boolean(p.facebookContactCreated),
    facebookContactMerged: Boolean(p.facebookContactMerged),
    skippedDuplicate: true,
  };
};

export type ProcessFacebookGoogleSearchForLeadOptions = {
  /** `leads_table`: one list-row run per lead. `lead_detail`: repeatable from lead detail / jobs. */
  requestSource?: FacebookGoogleSearchRequestSource;
};

/**
 * Manual Facebook Google SERP + resolution + optional Apify (same work as POST lead-google-search/facebook).
 */
export const processFacebookGoogleSearchForLead = async (
  supabase: SupabaseClient,
  leadId: string,
  options?: ProcessFacebookGoogleSearchForLeadOptions
): Promise<ProcessFacebookGoogleSearchForLeadSuccess> => {
  const requestSource: FacebookGoogleSearchRequestSource = options?.requestSource ?? 'lead_detail';

  if (requestSource === 'leads_table') {
    const priorRun = await getLatestLeadsTableFacebookGoogleSearchForLead(supabase, leadId);
    if (priorRun) {
      console.log(
        'ℹ️ lead-google-search/facebook: skipping — leads-table Facebook search already used for this lead',
        { leadId, runId: priorRun.id, status: priorRun.status }
      );
      return buildSuccessFromPriorPayload(leadId, priorRun.id, priorRun.payload);
    }
  }

  const run = await createActiveFacebookGoogleSearch(supabase, leadId, requestSource);
  const runId = run.id;

  try {
    const discovery = await runFacebookSerpDiscovery({ supabase, leadId });
    const resolution = await runFacebookSerpResolution({
      supabase,
      runId,
      ...discovery,
    });

    let leadUpdated = false;
    if (resolution.resolvedUrl) {
      await updateLead(supabase, discovery.lead.id, { facebook_url: resolution.resolvedUrl });
      leadUpdated = true;
      console.log('💾 lead-google-search/facebook: lead URL updated', { leadId: discovery.lead.id });
    }

    const leadAfter = await getLeadById(supabase, leadId);
    const profileUrl =
      resolution.resolvedUrl?.trim() ||
      leadAfter?.facebook_url?.trim() ||
      discovery.lead.facebook_url?.trim() ||
      '';

    const contacts = await getLeadContactsByLeadId(supabase, leadId);

    let facebookApifySkipped: string | undefined;
    let facebookApifyError: string | undefined;
    let facebookContactCreated = false;
    let facebookContactMerged = false;

    if (hasAnyLeadContactWithEmailAndPhone(contacts)) {
      facebookApifySkipped = 'lead_has_complete_contact';
      console.log(
        'ℹ️ lead-google-search/facebook: skipping Apify — a contact already has email and phone'
      );
    } else if (profileUrl) {
      const apify = await applyFacebookPageDetailsApifyToLead(supabase, leadId, profileUrl);
      if (!apify.success) {
        facebookApifyError = apify.error;
        console.warn('⚠️ lead-google-search/facebook: Apify failed', apify.error);
      } else {
        facebookContactCreated = Boolean(apify.contactCreated);
        facebookContactMerged = Boolean(apify.contactMerged);
      }
    }

    const payload: Record<string, unknown> = {
      platform: discovery.platform,
      serpQuery: discovery.serpQuery,
      serpLinks: discovery.serpLinks,
      leadUpdated,
      profileUrl: profileUrl || null,
      ...(facebookApifySkipped ? { facebookApifySkipped } : {}),
      ...(facebookApifyError ? { facebookApifyError } : {}),
      facebookContactCreated,
      facebookContactMerged,
    };
    if (resolution.resolvedUrl !== null) payload.resolvedUrl = resolution.resolvedUrl;
    if (resolution.aiAudit) payload.aiAudit = resolution.aiAudit;
    if (resolution.aiError) payload.aiError = resolution.aiError;

    await finalizeFacebookGoogleSearch(supabase, runId, 'succeeded', {
      payload,
    });

    return {
      leadId,
      runId,
      platform: discovery.platform,
      linkCount: discovery.serpLinks.length,
      hasProfiles: Boolean(resolution.resolvedUrl),
      leadUpdated,
      websiteUrls: [],
      resolveSerpPrompts: resolution.resolveSerpPrompts,
      facebookApifySkipped,
      facebookApifyError,
      facebookContactCreated,
      facebookContactMerged,
    };
  } catch (inner: unknown) {
    const msg = inner instanceof Error ? inner.message : String(inner);
    await finalizeFacebookGoogleSearch(supabase, runId, 'failed', {
      errorMessage: msg,
    });
    throw inner;
  }
};
