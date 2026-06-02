/**
 * Lead Costs Router
 * POST /api/data/lead-costs, GET /api/data/lead-costs, GET /api/data/lead-costs/lead/:leadId
 */

import { Router, Request, Response } from 'express';
import { createLeadCost, getAllLeadCosts, getLeadCostsByLeadId } from './index';
import type { CreateLeadCostInput } from './create';

export const createLeadCostsRouter = (): Router => {
  const router = Router();

  /**
   * POST /api/data/lead-costs
   * Creates a manual or AI-attributed ledger cost row for a lead.
   */
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateLeadCostInput;
      if (!body?.lead_id || typeof body.lead_id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'lead_id is required',
          message: 'Invalid request body',
        });
        return;
      }

      const supabase = req.supabase;
      const created = await createLeadCost(supabase, {
        lead_id: body.lead_id,
        type: typeof body.type === 'string' ? body.type : 'other',
        description: typeof body.description === 'string' ? body.description : '',
        cost_cents: body.cost_cents,
        entry_source: body.entry_source,
      });

      res.status(201).json({
        success: true,
        data: created,
        message: 'Lead cost created',
      });
    } catch (error) {
      console.error('❌ POST /api/data/lead-costs:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      const isValidation =
        message.includes('required') ||
        message.includes('Invalid') ||
        message.includes('must be');
      res.status(isValidation ? 400 : 500).json({
        success: false,
        error: message,
        message: 'Failed to create lead cost',
      });
    }
  });

  /**
   * GET /api/data/lead-costs
   * Retrieves all lead costs, optionally filtered by leadId query
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const leadId = req.query.leadId as string | undefined;
      const supabase = req.supabase;
      const costs = await getAllLeadCosts(supabase, leadId ? { lead_id: leadId } : undefined);

      res.status(200).json({
        success: true,
        data: costs,
        count: costs.length,
        message: 'Lead costs retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/lead-costs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch lead costs',
      });
    }
  });

  /**
   * GET /api/data/lead-costs/lead/:leadId
   * Retrieves all costs for a specific lead
   */
  router.get('/lead/:leadId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { leadId } = req.params;

      if (!leadId || Array.isArray(leadId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lead ID',
          message: 'Lead ID must be a single string',
        });
        return;
      }

      const supabase = req.supabase;
      const costs = await getLeadCostsByLeadId(supabase, leadId);

      res.status(200).json({
        success: true,
        data: costs,
        count: costs.length,
        message: 'Lead costs retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/lead-costs/lead/:leadId:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch lead costs',
      });
    }
  });

  return router;
};
