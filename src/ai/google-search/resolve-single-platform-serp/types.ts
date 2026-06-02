import type { SerpProfilePlatform } from '../../../services/lead-research-shared/parse-serp-profile-platform';
import type { SerpResultRow } from '../resolve-serp-profiles/types';

export type { SerpProfilePlatform };

export type ResolveSinglePlatformSerpRequest = {
  platform: SerpProfilePlatform;
  businessName: string;
  city: string;
  state: string;
  results: SerpResultRow[];
  knownWebsiteHost?: string | null;
};

export type ResolveSinglePlatformSerpResponse = {
  success: boolean;
  url: string | null;
  error?: string;
  rawResponse?: string;
  model?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  prompts?: {
    systemPrompt: string;
    userMessage: string;
  };
};
