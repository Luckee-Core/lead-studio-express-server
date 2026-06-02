/**
 * Create a scrape run, run Playwright scrape, persist final status and payload.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  processWebsiteContentCrawl,
  type WebsiteContentPage,
  type WebsiteCrawlContactSignals,
} from '../../domains/website-content/processWebsiteContentCrawl';
import { createWebsiteScrapeRun } from './create';
import { updateWebsiteScrapeRun } from './update';
import type { WebsiteScrapeRun } from './get-all';

export type WebsiteScrapeTriggerInput = {
  leadId: string;
  website: string;
  /** Extra URLs (e.g. from Google) scraped in the same run, capped server-side. */
  additionalUrls?: string[];
};

export type WebsiteScrapeTriggerResult = {
  finalRun: WebsiteScrapeRun;
  scrapeRunId: string;
  /** Present when at least one page returned usable text. */
  pages?: WebsiteContentPage[];
  /** Regex + href-derived emails/phones from the crawl (for lead_contacts). */
  contactSignals?: WebsiteCrawlContactSignals;
};

/**
 * Runs the full flow: pending → active → Playwright scrape → completed/failed.
 */
export const processWebsiteScrapeTrigger = async (
  supabase: SupabaseClient,
  input: WebsiteScrapeTriggerInput
): Promise<WebsiteScrapeTriggerResult> => {
  const { leadId, website, additionalUrls } = input;

  const run = await createWebsiteScrapeRun(supabase, {
    lead_id: leadId,
    website,
    status: 'pending',
  });
  console.log('📥 Scrape run created:', run.id);

  await updateWebsiteScrapeRun(supabase, run.id, { status: 'active' });
  console.log('🤖 Playwright website scrape for run:', run.id);

  try {
    const { pages, playwrightPages, contactSignals } = await processWebsiteContentCrawl({
      website,
      additionalUrls,
    });

    const scrapedData: Record<string, unknown> = {
      source: 'playwright',
      pageCount: pages.length,
      playwrightPages,
      pageSummaries: pages.map((p) => ({
        url: p.url,
        title: p.title,
        markdownLength: p.markdown.length,
      })),
    };

    const ok = pages.length > 0;
    const finalRun = await updateWebsiteScrapeRun(supabase, run.id, {
      status: ok ? 'completed' : 'failed',
      scraped_data: scrapedData,
      error: ok ? null : 'No text extracted from website scrape',
      completed_at: new Date().toISOString(),
    });

    return {
      finalRun,
      scrapeRunId: run.id,
      ...(ok ? { pages, contactSignals } : { contactSignals }),
    };
  } catch (fetchError) {
    const errMessage =
      fetchError instanceof Error ? fetchError.message : 'Unknown website scrape error';
    console.error('❌ Playwright website scrape error:', fetchError, 'run:', run.id);
    const finalRun = await updateWebsiteScrapeRun(supabase, run.id, {
      status: 'failed',
      error: errMessage,
      completed_at: new Date().toISOString(),
    });
    return { finalRun, scrapeRunId: run.id };
  }
};
