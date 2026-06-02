import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from '../../../data/leads/get-all';
import type { SerpLink } from '../../../domains/google-search/processGoogleSerpScrape';

export type FacebookSerpPlatform = 'facebook';

export type FacebookSerpDiscoveryInput = {
  supabase: SupabaseClient;
  leadId: string;
};

export type FacebookSerpDiscoveryResult = {
  lead: Lead;
  platform: FacebookSerpPlatform;
  city: string;
  state: string;
  primaryWebsite: string | null;
  knownHost: string | null;
  serpQuery: string;
  serpLinks: SerpLink[];
};

export type FacebookSerpResolutionInput = {
  supabase: SupabaseClient;
  lead: Lead;
  runId: string;
  platform: FacebookSerpPlatform;
  city: string;
  state: string;
  knownHost: string | null;
  serpQuery: string;
  serpLinks: SerpLink[];
  primaryWebsite: string | null;
};

export type FacebookSerpResolutionResult = {
  resolvedUrl: string | null;
  aiError?: string;
  resolveSerpPrompts: { systemPrompt: string; userMessage: string } | null;
  aiAudit?:
    | {
        requestId: string;
        responseId: string;
        exchangeId: string;
      }
    | undefined;
};
