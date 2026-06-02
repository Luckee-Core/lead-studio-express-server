import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from '../../../data/leads/get-all';
import type { SerpLink } from '../../../domains/google-search/processGoogleSerpScrape';

export type LinkedinSerpPlatform = 'linkedin';

export type LinkedinSerpDiscoveryInput = {
  supabase: SupabaseClient;
  leadId: string;
};

export type LinkedinSerpDiscoveryResult = {
  lead: Lead;
  platform: LinkedinSerpPlatform;
  city: string;
  state: string;
  primaryWebsite: string | null;
  knownHost: string | null;
  serpQuery: string;
  serpLinks: SerpLink[];
};

export type LinkedinSerpResolutionInput = {
  supabase: SupabaseClient;
  lead: Lead;
  runId: string;
  platform: LinkedinSerpPlatform;
  city: string;
  state: string;
  knownHost: string | null;
  serpQuery: string;
  serpLinks: SerpLink[];
  primaryWebsite: string | null;
};

export type LinkedinSerpResolutionResult = {
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
