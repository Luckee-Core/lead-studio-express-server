/**
 * Leads Router
 * Routes for managing leads (full CRUD)
 */

import { Router, Request, Response } from 'express';
import {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from './index';
import { getFacebookResearchForLead } from './get-facebook-research-for-lead';
import { getWebsiteScrapeLatestSummaryForLead } from '../website-scrape-runs/get-website-scrape-latest-summary-for-lead';
import { getAiExchangeCostRowsForLead } from './get-ai-exchange-cost-rows-for-lead';
import { attachLeadResearchAttemptFlagsToLeads } from './attach-lead-research-attempt-flags-to-leads';

export const createLeadsRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/data/leads
   * Retrieves all leads, optionally filtered
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = req.supabase;
      const params = {
        status: req.query.status as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        searchRunId: req.query.searchRunId as string | undefined,
      };

      const leads = await getAllLeads(supabase, params);
      const data = await attachLeadResearchAttemptFlagsToLeads(supabase, leads);

      res.status(200).json({
        success: true,
        data,
        count: data.length,
        message: 'Leads retrieved successfully',
      });
    } catch (error) {
      console.error('Error in GET /api/data/leads:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch leads',
      });
    }
  });


  /**
   * GET /api/data/leads/:id/facebook-research
   * Latest succeeded Facebook page + posts scrape payloads for the lead.
   * Registered before GET /:id so "facebook-research" is not parsed as an id.
   */
  router.get(
    '/:id/facebook-research',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;

        if (!id || Array.isArray(id)) {
          res.status(400).json({
            success: false,
            error: 'Invalid lead ID',
            message: 'Lead ID must be a single string',
          });
          return;
        }

        const supabase = req.supabase;
        const data = await getFacebookResearchForLead(supabase, id);

        res.status(200).json({
          success: true,
          data,
          message: 'Facebook research retrieved successfully',
        });
      } catch (error) {
        console.error('Error in GET /api/data/leads/:id/facebook-research:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          message: 'Failed to fetch Facebook research',
        });
      }
    }
  );

  /**
   * GET /api/data/leads/:id/website-scrape-latest
   * Whether the lead has a completed crawl with usable page text (for description-from-stored).
   */
  router.get(
    '/:id/website-scrape-latest',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;

        if (!id || Array.isArray(id)) {
          res.status(400).json({
            success: false,
            error: 'Invalid lead ID',
            message: 'Lead ID must be a single string',
          });
          return;
        }

        const supabase = req.supabase;
        const data = await getWebsiteScrapeLatestSummaryForLead(supabase, id);

        res.status(200).json({
          success: true,
          data,
          message: 'Website scrape summary retrieved successfully',
        });
      } catch (error) {
        console.error('Error in GET /api/data/leads/:id/website-scrape-latest:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          message: 'Failed to fetch website scrape summary',
        });
      }
    }
  );

  /**
   * GET /api/data/leads/:id/ai-exchange-costs
   * AI exchanges for this lead (contact chat, website at-a-glance, Google profile SERP resolution)
   * with token counts for cost calc.
   */
  router.get(
    '/:id/ai-exchange-costs',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;

        if (!id || Array.isArray(id)) {
          res.status(400).json({
            success: false,
            error: 'Invalid lead ID',
            message: 'Lead ID must be a single string',
          });
          return;
        }

        const supabase = req.supabase;
        const data = await getAiExchangeCostRowsForLead(supabase, id);

        res.status(200).json({
          success: true,
          data,
          count: data.length,
          message: 'Lead AI exchange costs retrieved successfully',
        });
      } catch (error) {
        console.error('Error in GET /api/data/leads/:id/ai-exchange-costs:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          message: 'Failed to fetch lead AI exchange costs',
        });
      }
    },
  );

  /**
   * GET /api/data/leads/:id
   * Retrieves a single lead by ID
   */
  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lead ID',
          message: 'Lead ID must be a single string',
        });
        return;
      }

      const supabase = req.supabase;
      const lead = await getLeadById(supabase, id);

      if (!lead) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Lead with ID '${id}' not found`,
        });
        return;
      }

      const [data] = await attachLeadResearchAttemptFlagsToLeads(supabase, [lead]);

      res.status(200).json({
        success: true,
        data,
        message: 'Lead retrieved successfully',
      });
    } catch (error) {
      console.error('Error in GET /api/data/leads/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch lead',
      });
    }
  });

  /**
   * POST /api/data/leads
   * Creates a new lead
   */
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;

      if (!input.business_name || !input.idempotency_key) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'business_name and idempotency_key are required',
        });
        return;
      }

      const supabase = req.supabase;
      const lead = await createLead(supabase, input);
      const [data] = await attachLeadResearchAttemptFlagsToLeads(supabase, [lead]);

      res.status(201).json({
        success: true,
        data,
        message: 'Lead created successfully',
      });
    } catch (error) {
      console.error('Error in POST /api/data/leads:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create lead',
      });
    }
  });

  /**
   * PATCH /api/data/leads/:id
   * Updates an existing lead
   */
  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const input = req.body;

      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lead ID',
          message: 'Lead ID must be a single string',
        });
        return;
      }

      const supabase = req.supabase;
      const lead = await updateLead(supabase, id, input);
      const [data] = await attachLeadResearchAttemptFlagsToLeads(supabase, [lead]);

      res.status(200).json({
        success: true,
        data,
        message: 'Lead updated successfully',
      });
    } catch (error) {
      console.error('Error in PATCH /api/data/leads/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update lead',
      });
    }
  });

  /**
   * DELETE /api/data/leads/:id
   * Deletes a lead
   */
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lead ID',
          message: 'Lead ID must be a single string',
        });
        return;
      }

      const supabase = req.supabase;
      await deleteLead(supabase, id);

      res.status(200).json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      console.error('Error in DELETE /api/data/leads/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete lead',
      });
    }
  });

  return router;
};
