import type { ExtractedWebsitePerson, ExtractPeopleFromWebsiteCrawlResult } from './types';

const stripCodeFences = (raw: string): string => {
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/```\s*$/, '');
  return text.trim();
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizePhoneDigits = (raw: string): string => raw.replace(/\D/g, '');

/** Lowercase, collapse spaces, strip common suffix noise for comparing name vs business name. */
const normalizeBusinessKey = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b(llc|pllc|inc|corp|ltd|pc)\b\.?/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

const cleanString = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t || null;
};

/**
 * Parses model JSON and drops invalid or junk rows (e.g. business name as "person").
 */
export const parseExtractPeopleFromWebsiteCrawlResponse = (
  aiResponse: string,
  businessName: string
): Pick<ExtractPeopleFromWebsiteCrawlResult, 'success' | 'contacts' | 'error'> => {
  try {
    const text = stripCodeFences(aiResponse);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const rawList = parsed.contacts;
    if (!Array.isArray(rawList)) {
      return { success: false, contacts: [], error: 'Missing contacts array in JSON' };
    }

    const bizNorm = normalizeBusinessKey(businessName);
    const out: ExtractedWebsitePerson[] = [];
    const seenNameEmail = new Set<string>();

    for (const item of rawList) {
      if (typeof item !== 'object' || item === null) continue;
      const o = item as Record<string, unknown>;
      const name = cleanString(o.name);
      if (!name || name.length < 2) continue;

      const nameNorm = normalizeBusinessKey(name);
      if (bizNorm.length >= 3 && nameNorm === bizNorm) {
        continue;
      }

      let email = cleanString(o.email)?.replace(/\*/g, '').trim() ?? null;
      let phone = cleanString(o.phone)?.replace(/\*/g, ' ').replace(/\s+/g, ' ').trim() ?? null;
      if (email === '') email = null;
      if (phone === '') phone = null;

      if (email && !EMAIL_RE.test(email)) {
        email = null;
      }
      if (phone) {
        const digits = normalizePhoneDigits(phone);
        if (digits.length < 10) phone = null;
      }

      if (!email && !phone) continue;

      const dedupeKey = `${nameNorm}|${(email ?? '').toLowerCase()}|${normalizePhoneDigits(phone ?? '')}`;
      if (seenNameEmail.has(dedupeKey)) continue;
      seenNameEmail.add(dedupeKey);

      const title = cleanString(o.title) ?? cleanString(o.role);

      out.push({
        name,
        title,
        email,
        phone,
      });
      if (out.length >= 8) break;
    }

    return { success: true, contacts: out };
  } catch (e) {
    return {
      success: false,
      contacts: [],
      error: e instanceof Error ? e.message : 'Failed to parse JSON',
    };
  }
};
