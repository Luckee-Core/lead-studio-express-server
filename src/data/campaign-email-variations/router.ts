/**
 * Campaign Email Variations Router
 * Routes for managing campaign email variations
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import {
  getAllCampaignEmailVariations,
  getCampaignEmailVariationById,
  createCampaignEmailVariation,
  updateCampaignEmailVariation,
  deleteCampaignEmailVariation,
} from './index';

export const createCampaignEmailVariationsRouter = (): Router => {
  const router = Router();

  router.get('/campaign/:campaignId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { campaignId } = req.params;
      if (!campaignId || Array.isArray(campaignId)) {
        res.status(400).json({ success: false, error: 'Invalid campaign ID' });
        return;
      }
      const supabase = getSupabaseClient();
      const variations = await getAllCampaignEmailVariations(supabase, campaignId);
      res.status(200).json({ success: true, data: variations, count: variations.length });
    } catch (error) {
      console.error('Error in GET /api/data/campaign-email-variations/campaign/:campaignId:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid variation ID' });
        return;
      }
      const supabase = getSupabaseClient();
      const variation = await getCampaignEmailVariationById(supabase, id);
      if (!variation) {
        res.status(404).json({ success: false, error: 'Variation not found' });
        return;
      }
      res.status(200).json({ success: true, data: variation });
    } catch (error) {
      console.error('Error in GET /api/data/campaign-email-variations/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;
      if (!input.campaign_id || !input.subject || !input.body) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: campaign_id, subject, body',
        });
        return;
      }
      const supabase = getSupabaseClient();
      const variation = await createCampaignEmailVariation(supabase, {
        campaign_id: input.campaign_id,
        subject: input.subject,
        body: input.body,
      });
      res.status(201).json({ success: true, data: variation });
    } catch (error) {
      console.error('Error in POST /api/data/campaign-email-variations:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const input = req.body;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid variation ID' });
        return;
      }
      const supabase = getSupabaseClient();
      const variation = await updateCampaignEmailVariation(supabase, id, input);
      res.status(200).json({ success: true, data: variation });
    } catch (error) {
      console.error('Error in PATCH /api/data/campaign-email-variations/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid variation ID' });
        return;
      }
      const supabase = getSupabaseClient();
      await deleteCampaignEmailVariation(supabase, id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in DELETE /api/data/campaign-email-variations/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
