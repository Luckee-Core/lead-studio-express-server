/**
 * Lead Categories Router
 * Routes for lead categories CRUD
 */

import { Router, Request, Response } from 'express';
import { getAllLeadCategories } from './index';
import { createLeadCategory } from './create';
import { updateLeadCategory } from './update';
import { deleteLeadCategory } from './delete';

export const createLeadCategoriesRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/data/lead-categories
   * Retrieves all lead categories
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = req.supabase;
      const categories = await getAllLeadCategories(supabase);

      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length,
        message: 'Lead categories retrieved successfully',
      });
    } catch (error) {
      console.error('Error in GET /api/data/lead-categories:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch lead categories',
      });
    }
  });

  /**
   * POST /api/data/lead-categories
   * Creates a lead category
   */
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;
      if (!input?.name || !input?.normalized_name) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'name and normalized_name are required',
        });
        return;
      }

      const category = await createLeadCategory(req.supabase, {
        name: String(input.name),
        normalized_name: String(input.normalized_name),
        leads_count: input.leads_count ?? 0,
      });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Lead category created successfully',
      });
    } catch (error) {
      console.error('Error in POST /api/data/lead-categories:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create lead category',
      });
    }
  });

  /**
   * PATCH /api/data/lead-categories/:id
   * Updates lead category name/normalized name
   */
  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid category ID',
          message: 'Category ID must be a single string',
        });
        return;
      }

      const input = req.body;
      const updated = await updateLeadCategory(req.supabase, id, {
        name: input?.name,
        normalized_name: input?.normalized_name,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Lead category updated successfully',
      });
    } catch (error) {
      console.error('Error in PATCH /api/data/lead-categories/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update lead category',
      });
    }
  });

  /**
   * DELETE /api/data/lead-categories/:id
   * Deletes category and detaches it from related leads
   */
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid category ID',
          message: 'Category ID must be a single string',
        });
        return;
      }

      await deleteLeadCategory(req.supabase, id);

      res.status(200).json({
        success: true,
        message: 'Lead category deleted successfully',
      });
    } catch (error) {
      console.error('Error in DELETE /api/data/lead-categories/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete lead category',
      });
    }
  });

  return router;
};
