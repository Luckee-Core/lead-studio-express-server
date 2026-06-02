import type { ExtractPeopleFromWebsiteCrawlRequest } from './types';

const MAX_TOTAL_CHARS = 100_000;
const MAX_PER_PAGE_CHARS = 28_000;

const truncate = (s: string, max: number): string => {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n\n[…truncated…]`;
};

/**
 * Prompts: extract named people with email/phone from crawl (JSON only).
 */
export const buildExtractPeopleFromWebsiteCrawlPrompt = (
  request: ExtractPeopleFromWebsiteCrawlRequest
): { systemPrompt: string; userMessage: string } => {
  const systemPrompt = `You extract **named people** (human individuals) from small-business website text for a CRM.

Return ONLY valid JSON. No markdown fences, no text before or after.

Required shape:
{
  "contacts": [
    {
      "name": "string — a real person's first and last name (or professional name as shown)",
      "title": "string or null — job title: Partner, Attorney, Owner, etc.",
      "email": "string or null — one email for this person",
      "phone": "string or null — one phone for this person in US/international form"
    }
  ]
}

Rules:
1) **People only**: Include rows where the crawl clearly associates a **person's name** with a role and/or contact info (team page, attorney list, leadership, contact cards). Do not use the **company legal name** (e.g. "Acme LLC") as \`name\` unless the site names a single human identically and it is clearly a person.
2) **No duplicate people**: Same person once. Merge if the same name appears twice.
3) **Separate fields**: Never put email and phone in the same string. Never use "*" or concatenation. Each field is separate or null.
4) **Grounding**: Do not invent emails, phones, or names. Only use what is supported by the crawl text.
5) **Generic inboxes**: If the site only shows generic emails (info@, contact@) with **no** named person, return \`"contacts": []\`. Do not create three rows with the business name.
6) **Completeness**: Prefer rows that have at least **email or phone** (ideally both when the site shows both for that person).
7) **Cap**: At most 8 contacts. Order by clearest signal first (e.g. leadership, then team).

If no qualifying people are found, return { "contacts": [] }.`;

  const headerLines = [
    `Company (from CRM): ${request.businessName.trim() || '(unknown)'}`,
    '',
    'Website content (markdown) by page URL:',
    '',
  ];

  let budget = MAX_TOTAL_CHARS - headerLines.join('\n').length - 200;
  const sections: string[] = [];

  for (const page of request.pages) {
    if (budget <= 0) break;
    const blockHeader = `---\nURL: ${page.url}\nTitle: ${page.title}\n---\n`;
    const body = truncate(page.markdown, Math.min(MAX_PER_PAGE_CHARS, budget));
    const chunk = blockHeader + body;
    sections.push(chunk);
    budget -= chunk.length;
  }

  const userMessage = `${headerLines.join('\n')}${sections.join('\n\n')}`;

  return { systemPrompt, userMessage };
};
