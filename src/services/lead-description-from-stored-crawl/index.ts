import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getLeadById } from '../../data/leads/get-by-id';
import { updateLead } from '../../data/leads/update';
import {
  createLeadWebsiteAiExchange,
  createLeadWebsiteAiRequest,
  createLeadWebsiteAiResponse,
} from '../../data/lead-website-ai';
import { getLatestCompletedWebsiteScrapeRunForLead } from '../../data/website-scrape-runs/get-latest-completed-by-lead-id';
import { getPagesFromScrapedData } from '../../domains/website-content/map-dataset-items-to-pages';
import { buildLeadSummaryFromWebsiteOverviewAi } from '../../ai/website-content/summarize-business-overview/build-lead-summary-payload';
import { processSummarizeBusinessOverview } from '../../ai/website-content/summarize-business-overview/process-summarize-business-overview';
import { getManagedAnthropicClient } from '../ai/anthropic-client';
import { getManualLeadIdFromBody, verifyCronSecret } from '../lead-research-shared';

/**
 * POST /api/services/lead-description-from-stored-crawl
 * Manual only: body `{ leadId }`. Uses latest completed website_scrape_runs row.
 */
export const runLeadDescriptionFromStoredWebsiteCrawl = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const leadId = getManualLeadIdFromBody(req);
  if (!leadId) {
    res.status(400).json({ success: false, error: 'leadId is required' });
    return;
  }

  const supabase = getSupabaseClient();

  try {
    const lead = await getLeadById(supabase, leadId);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    const scrapeRun = await getLatestCompletedWebsiteScrapeRunForLead(supabase, leadId);
    if (!scrapeRun) {
      res.status(400).json({
        success: false,
        error: 'no_stored_crawl',
        message: 'No completed website crawl for this lead. Run website research (crawl) first.',
      });
      return;
    }

    const pages = getPagesFromScrapedData(scrapeRun.scraped_data);
    if (pages.length === 0) {
      res.status(400).json({
        success: false,
        error: 'no_pages_in_stored_crawl',
        message: 'Stored crawl has no usable page text.',
      });
      return;
    }

    const anthropic = getManagedAnthropicClient();
    if (!anthropic) {
      res.status(500).json({ success: false, error: 'ANTHROPIC_API_KEY not configured' });
      return;
    }

    console.log('🤖 lead-description-from-stored-crawl: summarizing', {
      leadId,
      pageCount: pages.length,
      websiteScrapeRunId: scrapeRun.id,
    });

    const ai = await processSummarizeBusinessOverview(anthropic, {
      businessName: lead.business_name,
      address: lead.address ?? null,
      pages,
    });

    const aiRequest = await createLeadWebsiteAiRequest(supabase, {
      leadId: lead.id,
      researchRunId: null,
      model: ai.model || 'unknown',
      requestPayloadJson: {
        source: 'stored_website_scrape',
        websiteScrapeRunId: scrapeRun.id,
        businessName: lead.business_name,
        address: lead.address ?? null,
        pageUrls: pages.map((p) => p.url),
        crawlPageCount: pages.length,
      },
      systemPrompt: ai.prompts?.systemPrompt || '',
      userMessage: ai.prompts?.userMessage || '',
    });

    const parsedJson =
      ai.success && ai.description
        ? {
            quick_take: ai.description,
            facts: ai.facts,
            concerns: ai.concerns,
          }
        : null;
    const aiResponse = await createLeadWebsiteAiResponse(supabase, {
      requestId: aiRequest.id,
      model: ai.model || 'unknown',
      status: ai.success ? 'success' : 'error',
      rawResponse: ai.rawResponse || null,
      parsedResponseJson: parsedJson,
      errorMessage: ai.error || null,
      usageInputTokens: ai.usage?.input_tokens ?? null,
      usageOutputTokens: ai.usage?.output_tokens ?? null,
    });

    await createLeadWebsiteAiExchange(supabase, {
      leadId: lead.id,
      researchRunId: null,
      requestId: aiRequest.id,
      responseId: aiResponse.id,
    });

    let leadUpdated = false;
    if (ai.success && ai.description) {
      const nextDesc = ai.description.trim();
      const prevDesc = (lead.description ?? '').trim();
      const summaryPayload = buildLeadSummaryFromWebsiteOverviewAi(ai, pages.length);
      const prevSummaryJson = JSON.stringify(lead.summary ?? null);
      const nextSummaryJson = JSON.stringify(summaryPayload);
      const shouldWrite =
        nextDesc && (nextDesc !== prevDesc || prevSummaryJson !== nextSummaryJson);
      if (shouldWrite) {
        await updateLead(supabase, lead.id, {
          description: nextDesc,
          summary: summaryPayload,
        });
        leadUpdated = true;
        console.log('💾 lead-description-from-stored-crawl: description + summary updated', {
          leadId: lead.id,
        });
      }
    }

    if (!ai.success) {
      res.status(200).json({
        success: false,
        leadId,
        websiteScrapeRunId: scrapeRun.id,
        crawlPageCount: pages.length,
        error: ai.error || 'AI summarization failed',
      });
      return;
    }

    res.status(200).json({
      success: true,
      leadId,
      websiteScrapeRunId: scrapeRun.id,
      crawlPageCount: pages.length,
      leadUpdated,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadDescriptionFromStoredWebsiteCrawl:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
