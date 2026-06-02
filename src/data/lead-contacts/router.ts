/**
 * Lead Contacts Router
 * Routes for managing lead contacts (by lead + CRUD)
 */

import { Router, Request, Response } from 'express';
import {
  getAllLeadContacts,
  getLeadContactsByLeadId,
  createLeadContact,
  updateLeadContact,
  deleteLeadContact,
} from './index';
import type { CreateLeadContactInput } from './create';
import type { UpdateLeadContactInput } from './update';

export const createLeadContactsRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/data/lead-contacts
   * Retrieves all lead contacts
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = req.supabase;
      const contacts = await getAllLeadContacts(supabase);

      res.status(200).json({
        success: true,
        data: contacts,
        count: contacts.length,
        message: 'Lead contacts retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/lead-contacts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch lead contacts',
      });
    }
  });

  /**
   * GET /api/data/lead-contacts/lead/:leadId
   * Retrieves all contacts for a lead (must be before /:id)
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
      const contacts = await getLeadContactsByLeadId(supabase, leadId);

      res.status(200).json({
        success: true,
        data: contacts,
        count: contacts.length,
        message: 'Lead contacts retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET /api/data/lead-contacts/lead/:leadId:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch lead contacts',
      });
    }
  });

  /**
   * POST /api/data/lead-contacts
   * Creates a new lead contact
   */
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input: CreateLeadContactInput = req.body;

      if (!input.lead_id || !input.name) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'lead_id and name are required',
        });
        return;
      }

      const supabase = req.supabase;
      const contact = await createLeadContact(supabase, input);

      res.status(201).json({
        success: true,
        data: contact,
        message: 'Lead contact created successfully',
      });
    } catch (error) {
      console.error('❌ POST /api/data/lead-contacts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create lead contact',
      });
    }
  });

  /**
   * PATCH /api/data/lead-contacts/:id
   * Updates an existing lead contact
   */
  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const input: UpdateLeadContactInput = req.body;

      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid contact ID',
          message: 'Contact ID must be a single string',
        });
        return;
      }

      const supabase = req.supabase;
      const contact = await updateLeadContact(supabase, id, input);

      res.status(200).json({
        success: true,
        data: contact,
        message: 'Lead contact updated successfully',
      });
    } catch (error) {
      console.error('❌ PATCH /api/data/lead-contacts/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update lead contact',
      });
    }
  });

  /**
   * DELETE /api/data/lead-contacts/:id
   * Deletes a lead contact
   */
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid contact ID',
          message: 'Contact ID must be a single string',
        });
        return;
      }

      const supabase = req.supabase;
      await deleteLeadContact(supabase, id);

      res.status(200).json({
        success: true,
        message: 'Lead contact deleted successfully',
      });
    } catch (error) {
      console.error('❌ DELETE /api/data/lead-contacts/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete lead contact',
      });
    }
  });

  return router;
};
