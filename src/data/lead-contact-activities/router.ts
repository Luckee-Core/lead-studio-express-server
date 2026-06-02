import { Router, Request, Response } from 'express';
import { createLeadContactActivity, getAllLeadContactActivities } from './index';
import type { CreateLeadContactActivityInput } from './create';

export const createLeadContactActivitiesRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = req.supabase;
      const activities = await getAllLeadContactActivities(supabase);

      res.status(200).json({
        success: true,
        data: activities,
        count: activities.length,
        message: 'Lead contact activities retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/lead-contact-activities:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch lead contact activities',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input: CreateLeadContactActivityInput = req.body;
      if (
        !input.lead_contact_id ||
        !input.lead_id ||
        !input.customer_id ||
        !input.customer_name
      ) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message:
            'lead_contact_id, lead_id, customer_id, and customer_name are required',
        });
        return;
      }

      const supabase = req.supabase;
      const activity = await createLeadContactActivity(supabase, input);

      res.status(201).json({
        success: true,
        data: activity,
        message: 'Lead contact activity created successfully',
      });
    } catch (error) {
      console.error('❌ POST /api/data/lead-contact-activities:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create lead contact activity',
      });
    }
  });

  return router;
};
