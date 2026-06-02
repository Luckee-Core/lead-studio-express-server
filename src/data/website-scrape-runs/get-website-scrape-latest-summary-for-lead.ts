import { SupabaseClient } from '@supabase/supabase-js';
import { getPagesFromScrapedData } from '../../domains/website-content/map-dataset-items-to-pages';
import { getLatestCompletedWebsiteScrapeRunForLead } from './get-latest-completed-by-lead-id';

export type WebsiteScrapeLatestSummary = {
  hasCompletedCrawl: boolean;
  pageCount: number;
  completedAt: string | null;
  scrapeRunId: string | null;
};

/**
 * UI hint: whether a lead has stored crawl text usable for description-from-stored-crawl.
 */
export const getWebsiteScrapeLatestSummaryForLead = async (
  supabase: SupabaseClient,
  leadId: string
): Promise<WebsiteScrapeLatestSummary> => {
  const run = await getLatestCompletedWebsiteScrapeRunForLead(supabase, leadId);
  if (!run) {
    return {
      hasCompletedCrawl: false,
      pageCount: 0,
      completedAt: null,
      scrapeRunId: null,
    };
  }
  const pages = getPagesFromScrapedData(run.scraped_data);
  return {
    hasCompletedCrawl: pages.length > 0,
    pageCount: pages.length,
    completedAt: run.completed_at,
    scrapeRunId: run.id,
  };
};
