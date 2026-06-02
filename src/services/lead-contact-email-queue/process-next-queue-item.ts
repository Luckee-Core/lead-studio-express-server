/**
 * Process Next Queue Item
 * Gets the next queued item and sends the email, regardless of whether it's due
 * Skips business hours check (force send)
 * Routes by queue item type to type-specific processors
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getNextQueueItem, updateQueueItemStatus } from '../../data/lead-contact-email-queue';
import { processCustomEmailQueueItem } from './custom-email';

export interface ProcessNextQueueItemResult {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export const processNextQueueItem = async (
  supabase: SupabaseClient
): Promise<ProcessNextQueueItemResult> => {
  const result: ProcessNextQueueItemResult = {
    success: true,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    const item = await getNextQueueItem(supabase);

    if (!item) {
      console.log('No queued items to process');
      return result;
    }

    result.processed = 1;

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

      result.successful = 1;
      console.log(`✅ Successfully sent email (queue item ${item.id}, type: ${item.type})`);
    } catch (error) {
      result.failed = 1;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Queue item ${item.id}: ${errorMessage}`);

      await updateQueueItemStatus(supabase, item.id, {
        status: 'failed',
        error_message: errorMessage,
      });

      console.error(`❌ Failed to process queue item ${item.id}:`, errorMessage);
    }

    return result;
  } catch (error) {
    console.error('Error processing next queue item:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
};
