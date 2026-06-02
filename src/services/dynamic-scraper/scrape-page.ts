import type { Page } from 'playwright';
import { MAX_TEXT_CHARS_PER_PAGE, NAVIGATION_TIMEOUT_MS } from './constants';
import type { PlaywrightScrapedPage } from './types';

type ExtractedPagePayload = {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  text: string;
};

/**
 * Extract visible text + basic metadata from the **current** document (no navigation).
 */
export const extractLoadedPlaywrightPageContent = async (
  page: Page,
  urlFallback: string
): Promise<PlaywrightScrapedPage> => {
  const extracted = await page.evaluate(() => {
    const PHONE_REGEX = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g;
    const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const contentOf = (sel: string) =>
      document.querySelector(sel)?.getAttribute('content')?.trim() ?? '';
    const og = (prop: string) =>
      document.querySelector(`meta[property="${prop}"]`)?.getAttribute('content')?.trim() ?? '';
    const textOf = (el: Element | null): string => {
      if (!el) return '';
      return (el.textContent || '').replace(/\s+/g, ' ').trim();
    };
    const collectSectionText = (selectors: string[]): string => {
      const seen = new Set<string>();
      const blocks: string[] = [];
      for (const selector of selectors) {
        const nodes = Array.from(document.querySelectorAll(selector));
        for (const node of nodes) {
          const t = textOf(node);
          if (!t || seen.has(t)) continue;
          seen.add(t);
          blocks.push(t);
        }
      }
      return blocks.join('\n');
    };
    const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();
    const normalizePhone = (raw: string): string => {
      const digits = raw.replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('1')) return `+1${digits.slice(1)}`;
      if (digits.length === 10) return `+1${digits}`;
      return raw.trim();
    };
    const contactSetFromText = (text: string): { emails: string[]; phones: string[] } => {
      const emailSet = new Set<string>();
      const phoneSet = new Set<string>();
      for (const match of text.match(EMAIL_REGEX) ?? []) {
        emailSet.add(normalizeEmail(match));
      }
      for (const match of text.match(PHONE_REGEX) ?? []) {
        phoneSet.add(normalizePhone(match));
      }
      return {
        emails: Array.from(emailSet),
        phones: Array.from(phoneSet),
      };
    };
    const collectContactHrefSignals = (): { emails: string[]; phones: string[] } => {
      const emailSet = new Set<string>();
      const phoneSet = new Set<string>();
      for (const a of Array.from(document.querySelectorAll('a[href]'))) {
        const href = (a.getAttribute('href') || '').trim();
        if (href.toLowerCase().startsWith('mailto:')) {
          const email = href.slice('mailto:'.length).split('?')[0]?.trim();
          if (email) emailSet.add(normalizeEmail(email));
        }
        if (href.toLowerCase().startsWith('tel:')) {
          const phone = href.slice('tel:'.length).trim();
          if (phone) phoneSet.add(normalizePhone(phone));
        }
      }
      return { emails: Array.from(emailSet), phones: Array.from(phoneSet) };
    };
    const title =
      document.title?.trim() ||
      og('og:title') ||
      contentOf('meta[name="twitter:title"]') ||
      '';
    const description = contentOf('meta[name="description"]') || og('og:description') || '';
    const ogTitle = og('og:title') || undefined;
    const ogDescription = og('og:description') || undefined;
    const canonical =
      document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
    const body = document.body;
    const bodyText = body ? (body.innerText || '').trim() : '';

    const headerText = collectSectionText(['header', '[role="banner"]', 'nav']);
    const footerText = collectSectionText([
      'footer',
      '[role="contentinfo"]',
      '.site-footer',
      '#footer',
      '.footer',
    ]);
    const sectionContactText = [headerText, footerText].filter(Boolean).join('\n');

    const textContacts = contactSetFromText([bodyText, sectionContactText].join('\n'));
    const hrefContacts = collectContactHrefSignals();
    const emails = Array.from(new Set([...textContacts.emails, ...hrefContacts.emails]));
    const phones = Array.from(new Set([...textContacts.phones, ...hrefContacts.phones]));

    const contactBlock = [
      emails.length > 0 ? `CONTACT_EMAILS: ${emails.join(', ')}` : '',
      phones.length > 0 ? `CONTACT_PHONES: ${phones.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const text = [contactBlock, headerText, bodyText, footerText]
      .filter(Boolean)
      .join('\n\n')
      .trim();
    return {
      title,
      description: description || undefined,
      ogTitle,
      ogDescription,
      canonical: canonical || undefined,
      text,
    };
  });

  let text = extracted.text;
  if (text.length > MAX_TEXT_CHARS_PER_PAGE) {
    text = text.slice(0, MAX_TEXT_CHARS_PER_PAGE);
  }

  return {
    url: page.url() || urlFallback,
    title: extracted.title || urlFallback,
    text,
    metadata: {
      description: extracted.description,
      ogTitle: extracted.ogTitle,
      ogDescription: extracted.ogDescription,
      canonical: extracted.canonical,
    },
  };
};

/**
 * Load URL in the given page and extract visible text + basic metadata.
 */
export const scrapePageWithPlaywright = async (
  page: Page,
  url: string
): Promise<PlaywrightScrapedPage> => {
  try {
    const res = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    if (res && res.status() >= 400) {
      return {
        url,
        title: '',
        text: '',
        metadata: {},
        error: `HTTP ${res.status()}`,
      };
    }

    return await extractLoadedPlaywrightPageContent(page, url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      url,
      title: '',
      text: '',
      metadata: {},
      error: msg,
    };
  }
};
