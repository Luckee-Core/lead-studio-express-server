import type { WebsiteContentPage } from '../../../domains/website-content/map-dataset-items-to-pages';

export type ExtractPeopleFromWebsiteCrawlRequest = {
  businessName: string;
  pages: WebsiteContentPage[];
};

/** One person to store on `lead_contacts` (maps `title` → `role`). */
export type ExtractedWebsitePerson = {
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
};

export type ExtractPeopleFromWebsiteCrawlResult = {
  success: boolean;
  contacts: ExtractedWebsitePerson[];
  error?: string;
  model: string;
  rawResponse?: string;
  usage?: { input_tokens: number; output_tokens: number };
  prompts?: { systemPrompt: string; userMessage: string };
};
