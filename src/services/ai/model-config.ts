/**
 * AI Model Configuration
 *
 * Defines temperature and maxTokens for each message type. All calls use Claude Haiku.
 * @see https://docs.anthropic.com/en/docs/build-with-claude/models
 */

export type ModelConfig = {
  model: string;
  temperature: number;
  maxTokens: number;
};

/** Single model for every message type. */
const HAIKU = 'claude-haiku-4-5-20251001';

const CONFIGS: Record<string, ModelConfig> = {
  classification: {
    model: HAIKU,
    temperature: 0.1,
    maxTokens: 100,
  },
  conversational: {
    model: HAIKU,
    temperature: 0.7,
    maxTokens: 500,
  },
  clarifying: {
    model: HAIKU,
    temperature: 0.3,
    maxTokens: 1000,
  },
  brainstorm: {
    model: HAIKU,
    temperature: 0.8,
    maxTokens: 1500,
  },
  strategic: {
    model: HAIKU,
    temperature: 0.5,
    maxTokens: 2000,
  },
  fact_extraction: {
    model: HAIKU,
    temperature: 0.2,
    maxTokens: 1000,
  },
  fact_reconciliation: {
    model: HAIKU,
    temperature: 0.1,
    maxTokens: 1000,
  },
  categorization: {
    model: HAIKU,
    temperature: 0.2,
    maxTokens: 500,
  },
  test_message_generation: {
    model: HAIKU,
    temperature: 0.7,
    maxTokens: 200,
  },
  extract_tickets_from_text: {
    model: HAIKU,
    temperature: 0,
    maxTokens: 4000,
  },
  icp_studio: {
    model: HAIKU,
    temperature: 0.25,
    maxTokens: 4096,
  },
  user_background_studio: {
    model: HAIKU,
    temperature: 0.4,
    maxTokens: 4096,
  },
  lead_contact_chat: {
    model: HAIKU,
    temperature: 0.4,
    maxTokens: 4096,
  },
  lead_contact_email_draft: {
    model: HAIKU,
    temperature: 0.28,
    maxTokens: 420,
  },
  lead_contact_email_followup_draft: {
    model: HAIKU,
    temperature: 0.28,
    maxTokens: 520,
  },
  services_studio: {
    model: HAIKU,
    temperature: 0.45,
    maxTokens: 4096,
  },
  email_persona_studio: {
    model: HAIKU,
    temperature: 0.4,
    maxTokens: 4096,
  },
  customer_chat: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  customer_chat_time_entry: {
    model: HAIKU,
    temperature: 0.1,
    maxTokens: 1200,
  },
  /** Map SERP rows to social/review URLs (JSON). */
  serp_profile_resolution: {
    model: HAIKU,
    temperature: 0.15,
    maxTokens: 2048,
  },
  /** Business overview from crawled website markdown → lead description (JSON). */
  website_business_overview: {
    model: HAIKU,
    temperature: 0.25,
    maxTokens: 8192,
  },
  /** Business overview from user dictation notes (JSON for lead summary). */
  lead_dictation_notes_overview: {
    model: HAIKU,
    temperature: 0.25,
    maxTokens: 4096,
  },
  /** Lead opportunity candidates from dictation notes (JSON suggestions). */
  lead_opportunity_dictation: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Named people + email/phone from crawl → lead_contacts (JSON). */
  website_extract_people: {
    model: HAIKU,
    temperature: 0.2,
    maxTokens: 4096,
  },
  /** Filter Reddit thread titles/snippets for Luckee GTM lead fit (JSON indices). */
  reddit_lead_relevance: {
    model: HAIKU,
    temperature: 0.2,
    maxTokens: 4096,
  },
  /** User topic list → compiled relevance brief for Reddit digest filter. */
  reddit_interest_compiler: {
    model: HAIKU,
    temperature: 0.2,
    maxTokens: 4096,
  },
  /** Marketing blog topic → ideation candidates (JSON array). */
  marketing_blog_ideation: {
    model: HAIKU,
    temperature: 0.55,
    maxTokens: 8192,
  },
  /** Marketing Blog Studio: coach chat while editing a saved post. */
  marketing_blog_studio: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Pitch deck: coach chat for a single slide (cover/problem/solution/market/ask). */
  pitch_deck_slide_studio: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Ticket Studio: coach chat on one task/ticket row. */
  ticket_studio: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Project detail studio: coach chat scoped to a project + its tickets. */
  project_studio_chat: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Instagram carousel: vision / strategy coach for the carousel root. */
  instagram_carousel_studio_chat: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Instagram carousel: per-slide copy / hook coach. */
  instagram_carousel_slide_studio_chat: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Settings: coach chat while editing versioned `ai_prompts` rows by type. */
  ai_prompts_studio_chat: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Priority Studio: in-chat transcript only; length/tone guided by system prompt (high output budget). */
  priority_studio_chat: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 8192,
  },
  /** Lead digest: why this business fits the ICP (plain prose for sales email). */
  lead_digest_call_reason: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 2048,
  },
  /** Knowledge base: transcript-grounded chat (JSON sections in assistant reply). */
  knowledge_transcript_chat: {
    model: HAIKU,
    temperature: 0.25,
    maxTokens: 4096,
  },
  /** Paste-ready Lovable / site-builder prompt from dictation + lead context. */
  lead_lovable_design_prompt: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 4096,
  },
  /** Facebook page post cadence → 0–100 activity score (JSON). */
  facebook_activity_score: {
    model: HAIKU,
    temperature: 0.15,
    maxTokens: 1024,
  },
  /** Image Creation studio: NL → TSX + matching HTML for Tailwind CDN iframe. */
  image_creation_layout: {
    model: HAIKU,
    temperature: 0.35,
    maxTokens: 8192,
  },
  /** Investor CRM: pasted fund profile → structured firm fields (JSON). */
  extract_investor_firm_profile: {
    model: HAIKU,
    temperature: 0.1,
    maxTokens: 4096,
  },
  /** Investor CRM: pasted roster / signatures → structured contacts (JSON). */
  extract_investor_contact_sheet: {
    model: HAIKU,
    temperature: 0.1,
    maxTokens: 8192,
  },
};

export const getModelConfig = (messageType: string): ModelConfig => {
  const config = CONFIGS[messageType];
  if (!config) {
    throw new Error(`Unknown message type: ${messageType}`);
  }
  return config;
};
