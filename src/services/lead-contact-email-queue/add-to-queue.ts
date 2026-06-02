/**
 * Add Lead Contact to Email Queue
 * Validates the contact, checks for duplicates, calculates scheduled time,
 * and adds the contact to the queue
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { getLeadContactById } from '../../data/lead-contacts';
import {
  getLatestQueueItem,
  checkExistingQueueItem,
  createQueueItem,
  LeadContactEmailQueue,
} from '../../data/lead-contact-email-queue';
import { enforceTimeWindow } from '../../utils/email-scheduling';
import { getStartingTimeForEstQueueDay } from '../../utils/email-scheduling/get-starting-time-for-est-queue-day';

export type AddToQueueScheduleFor = 'default' | 'today' | 'tomorrow' | 'date';

export type AddToQueueOptions = {
  persona_id?: string | null;
  campaign_id?: string | null;
  /** Required: outbound send uses this draft (custom_email only). */
  lead_contact_email_id: string;
  /** default: chain after latest queue time or now. today/tomorrow/date: chain on that Eastern calendar day. */
  schedule_for?: AddToQueueScheduleFor;
  /** Required when schedule_for is date. Eastern calendar date YYYY-MM-DD. */
  schedule_date?: string;
};

export interface AddToQueueResult {
  success: boolean;
  queueItem?: LeadContactEmailQueue;
  error?: string;
}

export const addToQueue = async (
  supabase: SupabaseClient,
  lead_contact_id: string,
  options: AddToQueueOptions
): Promise<AddToQueueResult> => {
  try {
    const contact = await getLeadContactById(supabase, lead_contact_id);
    if (!contact) {
      return {
        success: false,
        error: 'Lead contact not found',
      };
    }

    if (!contact.email || contact.email.trim() === '') {
      return {
        success: false,
        error: 'Lead contact must have an email address',
      };
    }

    if (contact.status === 'bad_email') {
      return {
        success: false,
        error: 'Lead contact is marked bad email; remove that status before queueing',
      };
    }

    const existing = await checkExistingQueueItem(supabase, lead_contact_id);
    if (existing) {
      return {
        success: false,
        error: 'Lead contact is already in the queue',
      };
    }

    const draftId = options.lead_contact_email_id?.trim();
    if (!draftId) {
      return {
        success: false,
        error: 'lead_contact_email_id is required',
      };
    }

    const type = 'custom_email' as const;

    const nowEST = DateTime.now().setZone('America/New_York');
    const nowTime = nowEST.toJSDate();
    const randomMinutes = Math.floor(Math.random() * 8) + 5;

    let startingTime: Date;

    if (options.schedule_for === 'tomorrow') {
      startingTime = await getStartingTimeForEstQueueDay(
        supabase,
        nowEST.plus({ days: 1 }),
        nowEST
      );
    } else if (options.schedule_for === 'today') {
      startingTime = await getStartingTimeForEstQueueDay(supabase, nowEST, nowEST);
    } else if (options.schedule_for === 'date') {
      const raw = options.schedule_date?.trim();
      if (!raw) {
        return {
          success: false,
          error: 'schedule_date is required when schedule_for is date (use YYYY-MM-DD, Eastern calendar)',
        };
      }
      const day = DateTime.fromFormat(raw, 'yyyy-LL-dd', { zone: 'America/New_York' });
      if (!day.isValid) {
        return {
          success: false,
          error: 'Invalid schedule_date; use YYYY-MM-DD (Eastern calendar)',
        };
      }
      try {
        startingTime = await getStartingTimeForEstQueueDay(supabase, day, nowEST);
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : 'Invalid schedule date',
        };
      }
    } else {
      const latestItem = await getLatestQueueItem(supabase);
      if (latestItem) {
        const latestScheduledTime = new Date(latestItem.scheduled_at);
        startingTime = latestScheduledTime > nowTime ? latestScheduledTime : nowTime;
      } else {
        startingTime = nowTime;
      }
    }

    const calculatedTime = new Date(startingTime.getTime() + randomMinutes * 60 * 1000);
    const scheduledAt = enforceTimeWindow(calculatedTime);

    console.log('🕐 Scheduling diagnostics:');
    console.log(`   Current time: ${nowTime.toISOString()}`);
    console.log(`   schedule_for: ${options.schedule_for ?? 'default'}`);
    console.log(`   Starting from: ${startingTime.toISOString()}`);
    console.log(`   Type: ${type}`);
    console.log(`   Final (after time window): ${scheduledAt.toISOString()}`);

    const queueItem = await createQueueItem(supabase, {
      lead_contact_id: contact.id,
      lead_id: contact.lead_id,
      persona_id: options.persona_id ?? null,
      campaign_id: options.campaign_id ?? null,
      type,
      lead_contact_email_id: draftId,
      scheduled_at: scheduledAt.toISOString(),
    });

    return {
      success: true,
      queueItem,
    };
  } catch (error) {
    console.error('Error adding to queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
