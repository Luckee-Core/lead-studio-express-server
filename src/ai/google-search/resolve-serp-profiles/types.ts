export type SerpResultRow = {
  title: string;
  url: string;
};

export type ResolveSerpProfilesRequest = {
  businessName: string;
  city: string;
  state: string;
  results: SerpResultRow[];
  /**
   * When true, SERP was fetched with a social + Google Maps/reviews–biased query; prioritize those URLs.
   * Caller may still ignore website fields when persisting.
   */
  socialReviewsSerp?: boolean;
  /** CRM website hostname for disambiguation (optional). */
  knownWebsiteHost?: string | null;
};

/** Best-effort profile URLs and website picks inferred from SERP rows. */
export type ResolvedSerpProfiles = {
  /** Business-owned marketing site (their domain), when identifiable from titles/URLs. Never a social/listing host. */
  primaryWebsiteUrl: string | null;
  /**
   * Extra pages on the same owned domain as primary (paths/subdomains). Never third-party listings or social hosts.
   * Subset of input URLs; omit duplicates of primaryWebsiteUrl and profile URLs.
   */
  relevantWebsiteUrls: string[];
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  googleReviewsUrl: string | null;
  yelpUrl: string | null;
  /** Short explanation of ambiguous picks or nulls (optional). */
  notes?: string;
  /** URLs from the input list that were clearly not this business (optional). */
  rejectedUrls?: string[];
};

export type ResolveSerpProfilesResponse = {
  success: boolean;
  profiles: ResolvedSerpProfiles | null;
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
