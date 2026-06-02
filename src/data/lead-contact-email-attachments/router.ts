/**
 * Lead Contact Email Attachments Router
 * Handles file uploads, retrieval, and deletion
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getSupabaseClient } from '../../db/supabase-client';
import { uploadEmailAttachment } from '../../services/storage';
import {
  createAttachment,
  getAttachmentsByEmailId,
  getAttachmentById,
  deleteAttachment,
} from './index';
import type { EmailAttachmentType } from './types';
import { deleteEmailAttachment } from '../../services/storage';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only PDF, PNG, JPG allowed.'));
    }
    cb(null, true);
  },
});

const getFileType = (mimetype: string): EmailAttachmentType => {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/jpeg') return 'jpg';
  throw new Error(`Unsupported mimetype: ${mimetype}`);
};

export const createLeadContactEmailAttachmentsRouter = (): Router => {
  const router = Router();

  router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
      const { lead_contact_email_id, lead_id, lead_contact_id } = req.body;
      const file = req.file;

      if (!file || !lead_contact_email_id || !lead_id || !lead_contact_id) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: file, lead_contact_email_id, lead_id, lead_contact_id',
        });
        return;
      }

      const supabase = getSupabaseClient();

      const { storagePath } = await uploadEmailAttachment(supabase, {
        leadId: lead_id,
        leadContactId: lead_contact_id,
        emailId: lead_contact_email_id,
        file: file.buffer,
        fileName: file.originalname,
        contentType: file.mimetype,
      });

      const attachment = await createAttachment(supabase, {
        lead_contact_email_id,
        file_name: file.originalname,
        file_type: getFileType(file.mimetype),
        file_size_bytes: file.size,
        storage_path: storagePath,
      });

      res.status(201).json({
        success: true,
        data: attachment,
        message: 'Attachment uploaded successfully',
      });
    } catch (error) {
      console.error('Error in POST /api/data/lead-contact-email-attachments:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to upload attachment',
      });
    }
  });

  router.get('/:emailId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { emailId } = req.params;
      if (!emailId || Array.isArray(emailId)) {
        res.status(400).json({ success: false, error: 'Invalid email ID' });
        return;
      }

      const supabase = getSupabaseClient();
      const attachments = await getAttachmentsByEmailId(supabase, emailId);

      res.status(200).json({
        success: true,
        data: attachments,
        count: attachments.length,
        message: 'Attachments retrieved successfully',
      });
    } catch (error) {
      console.error('Error in GET /api/data/lead-contact-email-attachments/:emailId:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch attachments',
      });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid attachment ID' });
        return;
      }

      const supabase = getSupabaseClient();
      const attachment = await getAttachmentById(supabase, id);

      if (!attachment) {
        res.status(404).json({ success: false, error: 'Attachment not found' });
        return;
      }

      await deleteEmailAttachment(supabase, attachment.storage_path);
      await deleteAttachment(supabase, id);

      res.status(200).json({
        success: true,
        message: 'Attachment deleted successfully',
      });
    } catch (error) {
      console.error('Error in DELETE /api/data/lead-contact-email-attachments/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete attachment',
      });
    }
  });

  return router;
};
