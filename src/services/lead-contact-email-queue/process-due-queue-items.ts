/**
 * Process Due Queue Items
 * Gets all due queue items, routes each by type, sends emails, updates status
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getDueQueueItems, updateQueueItemStatus } from '../../data/lead-contact-email-queue';
import { processCustomEmailQueueItem } from './custom-email';
import {
  isWithinBusinessHours,
  enforceTimeWindow,
  getMiddaySendPauseInfo,
} from '../../utils/email-scheduling';

export type ProcessDueQueueMiddayPause = {
  enabled: boolean;
  active: boolean;
  dateKey?: string;
  windowStartIso?: string | null;
  windowEndIso?: string | null;
};

export interface ProcessDueQueueItemsResult {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
  middayPause?: ProcessDueQueueMiddayPause;
}

export const processDueQueueItems = async (
  supabase: SupabaseClient
): Promise<ProcessDueQueueItemsResult> => {
  const result: ProcessDueQueueItemsResult = {
    success: true,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    const withinBusinessHours = isWithinBusinessHours();
    const middayPause = getMiddaySendPauseInfo();
    result.middayPause = {
      enabled: middayPause.enabled,
      active: middayPause.active,
      ...(middayPause.enabled
        ? {
            dateKey: middayPause.dateKey,
            windowStartIso: middayPause.windowStartIso,
            windowEndIso: middayPause.windowEndIso,
          }
        : {}),
    };

    if (!withinBusinessHours) {
      console.log('⏰ Outside business hours (8 AM - 5 PM EST). Rescheduling due items to 8 AM tomorrow.');

      const dueItems = await getDueQueueItems(supabase, 100);

      if (dueItems.length > 0) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const nextBusinessDay = enforceTimeWindow(tomorrow);

        for (const item of dueItems) {
          try {
            await updateQueueItemStatus(supabase, item.id, {
              status: 'queued',
              scheduled_at: nextBusinessDay.toISOString(),
            });
            console.log(`📅 Rescheduled queue item ${item.id} to ${nextBusinessDay.toISOString()}`);
          } catch (error) {
            console.error(`❌ Failed to reschedule queue item ${item.id}:`, error);
          }
        }

        console.log(`✅ Rescheduled ${dueItems.length} queue item(s) to 8 AM EST tomorrow`);
      }

      return result;
    }

    if (middayPause.enabled && middayPause.active) {
      console.log(
        `☕ Midday send pause (11am–3pm window): skipping batch until ${middayPause.windowEndIso} (${middayPause.dateKey} America/New_York)`
      );
      return result;
    }

    const dueItems = await getDueQueueItems(supabase, 10);

    if (dueItems.length === 0) {
      console.log('No due email queue items');
      return result;
    }

    console.log(`Processing ${dueItems.length} due queue items`);

    for (const item of dueItems) {
      result.processed++;

      try {
        await updateQueueItemStatus(supabase, item.id, {
          status: 'sending',
        });

        let processResult: { success: boolean; error?: string };
        if (item.type === 'custom_email') {
          processResult = await processCustomEmailQueueItem(supabase, item);
        } else {
          throw new Error(
            `Unsupported queue type: ${(item as { type?: string }).type}. Only custom_email is supported.`
          );
        }

        if (!processResult.success) {
          throw new Error(processResult.error);
        }

        await updateQueueItemStatus(supabase, item.id, {
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        result.successful++;
        console.log(`✅ Successfully sent email (queue item ${item.id}, type: ${item.type})`);
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Queue item ${item.id}: ${errorMessage}`);

        await updateQueueItemStatus(supabase, item.id, {
          status: 'failed',
          error_message: errorMessage,
        });

        console.error(`❌ Failed to process queue item ${item.id}:`, errorMessage);
      }
    }

    console.log(
      `Queue processing complete: ${result.successful} successful, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error('Error processing due queue items:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
};
