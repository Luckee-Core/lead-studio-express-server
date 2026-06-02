import { Router, Request, Response } from 'express';
import { createLeadActivity, getAllLeadActivities } from './index';
import type { CreateLeadActivityInput } from './create';

export const createLeadActivitiesRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = req.supabase;
      const activities = await getAllLeadActivities(supabase);

      res.status(200).json({
        success: true,
        data: activities,
        count: activities.length,
        message: 'Lead activities retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/lead-activities:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch lead activities',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input: CreateLeadActivityInput = req.body;
      if (!input.lead_id || !input.customer_id || !input.customer_name) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'lead_id, customer_id, and customer_name are required',
        });
        return;
      }

      const supabase = req.supabase;
      const activity = await createLeadActivity(supabase, input);

      res.status(201).json({
        success: true,
        data: activity,
        message: 'Lead activity created successfully',
      });
    } catch (error) {
      console.error('❌ POST /api/data/lead-activities:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create lead activity',
      });
    }
  });

  return router;
};
