/**
 * Lead Contact Emails Router
 * Routes for managing lead contact emails
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../../db/supabase-client';
import {
  getLeadContactEmailsByContactId,
  getLeadContactEmailById,
  createLeadContactEmail,
  updateLeadContactEmail,
  deleteLeadContactEmail,
  sendBulkLeadContactEmails,
} from './index';
import { generateCampaignVariationEmail } from '../../services/email-generation';
import { sendCustomEmailNow } from '../../services/email-sending';
import { createLeadSentEmail } from '../lead-sent-emails';
import { sendLeadEmail } from '../../services/email/send-lead-email';
import { createOpenTrackingTokenForSend } from '../../services/email/open-tracking';
import { getLeadContactById } from '../lead-contacts';
import { updateLead } from '../leads';

export const createLeadContactEmailsRouter = (): Router => {
  const router = Router();

  router.get('/contact/:contactId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { contactId } = req.params;
      if (!contactId || Array.isArray(contactId)) {
        res.status(400).json({ success: false, error: 'Invalid contact ID' });
        return;
      }
      const supabase = getSupabaseClient();
      const emails = await getLeadContactEmailsByContactId(supabase, contactId);
      res.status(200).json({ success: true, data: emails, count: emails.length });
    } catch (error) {
      console.error('Error in GET /api/data/lead-contact-emails/contact/:contactId:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/generate-test', async (req: Request, res: Response): Promise<void> => {
    try {
      const { pickRandomTemplate } = await import('./email-templates');
      const { pickRandomSenderName } = await import('./sender-names');
      const { textToTiptapContent } = await import('./text-to-tiptap');

      const template = pickRandomTemplate();
      const fromName = pickRandomSenderName();
      const body = textToTiptapContent(template.body);

      res.status(200).json({
        success: true,
        data: {
          subject: template.subject,
          body,
          fromName,
          variationId: template.variationId,
        },
      });
    } catch (error) {
      console.error('Error in POST /api/data/lead-contact-emails/generate-test:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/generate', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;
      if (!input.lead_id || !input.lead_contact_id) {
        res.status(400).json({ success: false, error: 'Missing lead_id or lead_contact_id' });
        return;
      }
      const supabase = getSupabaseClient();
      const result = await generateCampaignVariationEmail(supabase, {
        lead_id: input.lead_id,
        lead_contact_id: input.lead_contact_id,
        campaign_id: input.campaign_id,
        campaign_ids: input.campaign_ids,
      });
      res.status(201).json({
        success: true,
        data: {
          email: result.email,
          fromName: result.fromName,
          variationId: result.variationId,
        },
      });
    } catch (error) {
      console.error('Error in POST /api/data/lead-contact-emails/generate:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/send-test', async (req: Request, res: Response): Promise<void> => {
    try {
      const { to, fromName, variationId, subject, body } = req.body;
      if (!to || !fromName || variationId == null || !subject || !body) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: to, fromName, variationId, subject, body',
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        res.status(400).json({ success: false, error: 'Invalid recipient email' });
        return;
      }
      await sendLeadEmail({ to, subject, body, fromName });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in POST /api/data/lead-contact-emails/send-test:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/send', async (req: Request, res: Response): Promise<void> => {
    try {
      const { leadEmailId, leadContactId, to, fromName, variationId, subject, body } = req.body;
      if (!leadEmailId || !leadContactId || !to || !fromName || variationId == null || !subject || !body) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: leadEmailId, leadContactId, to, fromName, variationId, subject, body',
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        res.status(400).json({ success: false, error: 'Invalid recipient email' });
        return;
      }
      const supabase = getSupabaseClient();

      const openTrackingToken = createOpenTrackingTokenForSend();

      const gmailMessageId = await sendLeadEmail({
        to,
        subject,
        body,
        fromName,
        openTrackingToken,
      });

      await createLeadSentEmail(supabase, {
        lead_email_id: leadEmailId,
        lead_contact_id: leadContactId,
        status: 'sent',
        from_name: fromName,
        variation_id: variationId,
        sg_message_id: gmailMessageId,
        open_tracking_token: openTrackingToken,
      });

      // Update lead status to 'contacted' if currently 'not_contacted'
      const contact = await getLeadContactById(supabase, leadContactId);
      if (contact?.lead_id) {
        // Only update if status is 'not_contacted' to avoid overwriting other statuses
        const currentLead = await supabase
          .from('leads')
          .select('status')
          .eq('id', contact.lead_id)
          .single();
        
        if (currentLead.data?.status === 'not_contacted') {
          await updateLead(supabase, contact.lead_id, { status: 'contacted' });
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in POST /api/data/lead-contact-emails/send:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/send-now', async (req: Request, res: Response): Promise<void> => {
    try {
      const { lead_contact_email_id, persona_id, email_sending_identity_id } = req.body;
      if (!lead_contact_email_id) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: lead_contact_email_id',
        });
        return;
      }
      const supabase = getSupabaseClient();
      const result = await sendCustomEmailNow(supabase, {
        leadContactEmailId: lead_contact_email_id,
        persona_id: persona_id ?? null,
        email_sending_identity_id:
          email_sending_identity_id === undefined ? undefined : email_sending_identity_id,
      });
      if (result.success) {
        res.status(200).json({
          success: true,
          data: { sentEmailId: result.sentEmailId },
          message: 'Email sent successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to send email',
        });
      }
    } catch (error) {
      console.error('Error in POST /api/data/lead-contact-emails/send-now:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send email',
      });
    }
  });

  router.post('/send-bulk', async (req: Request, res: Response): Promise<void> => {
    try {
      const { leadEmailId, contactIds, fromName, variationId, subject, body } = req.body;
      if (
        !leadEmailId ||
        !Array.isArray(contactIds) ||
        contactIds.length === 0 ||
        !fromName ||
        variationId == null ||
        !subject ||
        !body
      ) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: leadEmailId, contactIds (non-empty array), fromName, variationId, subject, body',
        });
        return;
      }

      const supabase = getSupabaseClient();
      const result = await sendBulkLeadContactEmails(supabase, {
        leadEmailId,
        contactIds,
        fromName,
        variationId,
        subject,
        body,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error in POST /api/data/lead-contact-emails/send-bulk:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid email ID' });
        return;
      }
      const supabase = getSupabaseClient();
      const email = await getLeadContactEmailById(supabase, id);
      if (!email) {
        res.status(404).json({ success: false, error: 'Email not found' });
        return;
      }
      res.status(200).json({ success: true, data: email });
    } catch (error) {
      console.error('Error in GET /api/data/lead-contact-emails/:id:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;
      if (!input.lead_id || !input.lead_contact_id || !input.subject || !input.body) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }
      const supabase = getSupabaseClient();
      const email = await createLeadContactEmail(supabase, input);
      res.status(201).json({ success: true, data: email });
    } catch (error) {
      console.error('Error in POST /api/data/lead-contact-emails:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const input = req.body;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid email ID' });
        return;
      }
      const supabase = getSupabaseClient();
      const email = await updateLeadContactEmail(supabase, id, input);
      res.status(200).json({ success: true, data: email });
    } catch (error) {
      console.error('Error in PATCH /api/data/lead-contact-emails/:id:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid email ID' });
        return;
      }
      const supabase = getSupabaseClient();
      await deleteLeadContactEmail(supabase, id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in DELETE /api/data/lead-contact-emails/:id:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  return router;
};
