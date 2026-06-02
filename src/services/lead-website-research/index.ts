import type { Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import { getLeadById } from '../../data/leads/get-by-id';
import { updateLead } from '../../data/leads/update';
import {
  createLeadWebsiteAiExchange,
  createLeadWebsiteAiRequest,
  createLeadWebsiteAiResponse,
} from '../../data/lead-website-ai';
import {
  hasActiveLeadWebsiteResearch,
  pickNextLeadIdForWebsiteResearch,
  createActiveLeadWebsiteResearch,
  finalizeLeadWebsiteResearch,
} from '../../data/lead-website-research';
import { processWebsiteScrapeTrigger } from '../../data/website-scrape-runs/processWebsiteScrapeTrigger';
import { buildLeadSummaryFromWebsiteOverviewAi } from '../../ai/website-content/summarize-business-overview/build-lead-summary-payload';
import { processSummarizeBusinessOverview } from '../../ai/website-content/summarize-business-overview/process-summarize-business-overview';
import { getManagedAnthropicClient } from '../../services/ai/anthropic-client';
import { getManualLeadIdFromBody, isWithinBusinessHours, verifyCronSecret } from '../lead-research-shared';
import { getPrimaryWebsiteForLead } from '../../utils/leads/get-primary-website-for-lead';
import { processExtractPeopleFromWebsiteCrawl } from '../../ai/website-content/extract-people-from-crawl';
import { applyWebsiteCrawlContactsFromAi } from './applyWebsiteCrawlContactsFromAi';

/**
 * POST /api/services/lead-website-research — cron: next eligible lead; body `{ leadId }`: that lead only.
 */
export const runLeadWebsiteResearch = async (req: Request, res: Response): Promise<void> => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const manualLeadId = getManualLeadIdFromBody(req);
  const supabase = getSupabaseClient();

  try {
    let leadId: string;

    if (manualLeadId) {
      leadId = manualLeadId;
    } else {
      if (!isWithinBusinessHours()) {
        res.status(200).json({ success: true, skipped: true, reason: 'outside_business_hours' });
        return;
      }

      if (await hasActiveLeadWebsiteResearch(supabase)) {
        res.status(200).json({ success: true, skipped: true, reason: 'active_run_exists' });
        return;
      }

      const picked = await pickNextLeadIdForWebsiteResearch(supabase);
      if (!picked) {
        res.status(200).json({ success: true, skipped: true, reason: 'no_eligible_lead' });
        return;
      }
      leadId = picked;
    }

    const run = await createActiveLeadWebsiteResearch(supabase, leadId);
    const runId = run.id;

    try {
      const lead = await getLeadById(supabase, leadId);
      const website = lead ? getPrimaryWebsiteForLead(lead) : null;
      if (!lead || !website) {
        await finalizeLeadWebsiteResearch(supabase, runId, 'failed', {
          errorMessage: 'Lead or website URL missing',
        });
        res.status(400).json({ success: false, error: 'Lead or website missing' });
        return;
      }

      const extra =
        Array.isArray(lead.website_urls) && lead.website_urls.length > 0
          ? lead.website_urls.filter((u) => typeof u === 'string' && u.trim())
          : undefined;

      const { finalRun, scrapeRunId, pages } = await processWebsiteScrapeTrigger(supabase, {
        leadId,
        website,
        ...(extra && extra.length > 0 ? { additionalUrls: extra } : {}),
      });

      const scrapeOk = finalRun.status === 'completed';
      const datasetItemCount =
        typeof finalRun.scraped_data?.pageCount === 'number'
          ? finalRun.scraped_data.pageCount
          : Array.isArray(finalRun.scraped_data?.playwrightPages)
            ? (finalRun.scraped_data.playwrightPages as unknown[]).length
            : 0;

      if (!scrapeOk) {
        await finalizeLeadWebsiteResearch(supabase, runId, 'failed', {
          errorMessage: finalRun.error || finalRun.status,
          payload: {
            websiteScrapeRunId: scrapeRunId,
            websiteScrapeStatus: finalRun.status,
            datasetItemCount,
          },
        });
        res.status(200).json({
          success: true,
          leadId,
          runId,
          websiteScrapeRunId: scrapeRunId,
          websiteScrapeStatus: finalRun.status,
          crawlPageCount: 0,
        });
        return;
      }

      let contactsCreatedFromWebsite = 0;
      let contactExtractionAiError: string | undefined;

      let leadUpdated = false;
      let aiError: string | undefined;
      let aiAudit:
        | {
            requestId: string;
            responseId: string;
            exchangeId: string;
          }
        | undefined;

      const anthropic = getManagedAnthropicClient();
      if (pages && pages.length > 0 && anthropic) {
        const peopleAi = await processExtractPeopleFromWebsiteCrawl(anthropic, {
          businessName: lead.business_name ?? '',
          pages,
        });
        if (peopleAi.success && peopleAi.contacts.length > 0) {
          const applied = await applyWebsiteCrawlContactsFromAi(
            supabase,
            leadId,
            peopleAi.contacts
          );
          contactsCreatedFromWebsite = applied.created;
        } else if (!peopleAi.success) {
          contactExtractionAiError = peopleAi.error;
          console.warn('⚠️ lead-website-research: people extraction failed', peopleAi.error);
        }

        console.log('🤖 lead-website-research: summarizing business from crawl', {
          leadId,
          pageCount: pages.length,
        });
        const ai = await processSummarizeBusinessOverview(anthropic, {
          businessName: lead.business_name,
          address: lead.address ?? null,
          pages,
        });

        const aiRequest = await createLeadWebsiteAiRequest(supabase, {
          leadId: lead.id,
          researchRunId: runId,
          model: ai.model || 'unknown',
          requestPayloadJson: {
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

        const exchange = await createLeadWebsiteAiExchange(supabase, {
          leadId: lead.id,
          researchRunId: runId,
          requestId: aiRequest.id,
          responseId: aiResponse.id,
        });

        aiAudit = {
          requestId: aiRequest.id,
          responseId: aiResponse.id,
          exchangeId: exchange.id,
        };

        if (ai.success && ai.description) {
          const nextDesc = ai.description.trim();
          const prevDesc = (lead.description ?? '').trim();
          const summaryPayload = buildLeadSummaryFromWebsiteOverviewAi(ai, pages.length);
          const prevSummaryJson = JSON.stringify(lead.summary ?? null);
          const nextSummaryJson = JSON.stringify(summaryPayload);
          const shouldWrite =
            nextDesc &&
            (nextDesc !== prevDesc || prevSummaryJson !== nextSummaryJson);
          if (shouldWrite) {
            await updateLead(supabase, lead.id, {
              description: nextDesc,
              summary: summaryPayload,
            });
            leadUpdated = true;
            console.log('💾 lead-website-research: lead description + summary updated', {
              leadId: lead.id,
            });
          } else {
            console.log('ℹ️ lead-website-research: description/summary unchanged or empty', {
              leadId: lead.id,
            });
          }
        } else {
          aiError = ai.error || 'AI summarization failed';
          console.warn('⚠️ lead-website-research: AI failed', aiError);
        }
      } else if (pages && pages.length > 0 && !anthropic) {
        aiError = 'ANTHROPIC_API_KEY not configured';
        console.warn('⚠️ lead-website-research: skipping AI —', aiError);
      }

      const pageUrls = pages?.map((p) => p.url) ?? [];

      await finalizeLeadWebsiteResearch(supabase, runId, 'succeeded', {
        payload: {
          websiteScrapeRunId: scrapeRunId,
          websiteScrapeStatus: finalRun.status,
          datasetItemCount,
          crawlPageCount: pages?.length ?? 0,
          pageUrls,
          contactsCreatedFromWebsite,
          ...(contactExtractionAiError ? { contactExtractionAiError } : {}),
          ...(aiAudit ? { aiAudit } : {}),
          leadUpdated,
          ...(aiError ? { aiError } : {}),
        },
      });

      res.status(200).json({
        success: true,
        leadId,
        runId,
        websiteScrapeRunId: scrapeRunId,
        websiteScrapeStatus: finalRun.status,
        crawlPageCount: pages?.length ?? 0,
        leadUpdated,
        contactsCreatedFromWebsite,
        hasDescriptionAi: Boolean(pages && pages.length > 0 && anthropic),
      });
    } catch (inner: unknown) {
      const msg = inner instanceof Error ? inner.message : String(inner);
      await finalizeLeadWebsiteResearch(supabase, runId, 'failed', { errorMessage: msg });
      throw inner;
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ runLeadWebsiteResearch:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
