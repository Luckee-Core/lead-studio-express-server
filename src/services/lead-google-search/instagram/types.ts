import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from '../../../data/leads/get-all';
import type { SerpLink } from '../../../domains/google-search/processGoogleSerpScrape';

export type InstagramSerpPlatform = 'instagram';

export type InstagramSerpDiscoveryInput = {
  supabase: SupabaseClient;
  leadId: string;
};

export type InstagramSerpDiscoveryResult = {
  lead: Lead;
  platform: InstagramSerpPlatform;
  city: string;
  state: string;
  primaryWebsite: string | null;
  knownHost: string | null;
  serpQuery: string;
  serpLinks: SerpLink[];
};

export type InstagramSerpResolutionInput = {
  supabase: SupabaseClient;
  lead: Lead;
  runId: string;
  platform: InstagramSerpPlatform;
  city: string;
  state: string;
  knownHost: string | null;
  serpQuery: string;
  serpLinks: SerpLink[];
  primaryWebsite: string | null;
};

export type InstagramSerpResolutionResult = {
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
