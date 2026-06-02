/**
 * SendGrid Webhook Router
 * Handles incoming webhook events from SendGrid
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../../../db/supabase-client';
import { processSendGridEvent, type SendGridWebhookEvent } from './process-sendgrid-event';

export const createSendGridWebhookRouter = (): Router => {
  const router = Router();

  /**
   * POST /webhook
   * Receive SendGrid webhook events
   * SendGrid sends events as an array of event objects
   */
  router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
    try {
      const events: SendGridWebhookEvent[] = req.body;

      // Validate payload is an array
      if (!Array.isArray(events)) {
        console.error('Invalid webhook payload: expected array of events');
        res.status(400).json({
          success: false,
          error: 'Invalid payload format: expected array of events',
        });
        return;
      }

      console.log(`Received ${events.length} SendGrid webhook events`);
      
      // Log event types for debugging
      const eventTypes = events.map(e => e.event).filter(Boolean);
      console.log(`Event types received: ${eventTypes.join(', ')}`);

      const supabase = getSupabaseClient();

      // Process each event
      let processedCount = 0;
      for (const event of events) {
        try {
          await processSendGridEvent(supabase, event);
          processedCount++;
        } catch (error) {
          console.error('Error processing individual SendGrid event:', error, event);
          // Continue processing other events even if one fails
        }
      }
      
      console.log(`Successfully processed ${processedCount} of ${events.length} events`);

      // Always return 200 to SendGrid (they will retry if we return error)
      res.status(200).json({
        success: true,
        message: `Processed ${events.length} events`,
      });
    } catch (error) {
      console.error('Error processing SendGrid webhook:', error);
      // Still return 200 to prevent SendGrid from retrying
      res.status(200).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
