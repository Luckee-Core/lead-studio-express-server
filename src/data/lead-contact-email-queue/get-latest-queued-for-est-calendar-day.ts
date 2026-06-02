/**
 * Get latest queued item whose scheduled_at falls on a given calendar day in America/New_York.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { LeadContactEmailQueue } from './types';

const EST_ZONE = 'America/New_York';

/**
 * Returns the queued item with the latest scheduled_at on the given EST calendar day, or null.
 *
 * @param supabase - Supabase client
 * @param estDay - Any instant on the target day in EST (e.g. "tomorrow" in EST)
 */
export const getLatestQueuedItemForEstCalendarDay = async (
  supabase: SupabaseClient,
  estDay: DateTime
): Promise<LeadContactEmailQueue | null> => {
  const dayStart = estDay.setZone(EST_ZONE).startOf('day');
  const dayEndExclusive = dayStart.plus({ days: 1 });
  const rangeStartIso = dayStart.toUTC().toISO();
  const rangeEndIso = dayEndExclusive.toUTC().toISO();

  if (!rangeStartIso || !rangeEndIso) {
    throw new Error('Failed to build EST calendar day range for queue query');
  }

  const { data, error } = await supabase
    .from('lead_contact_email_queue')
    .select('*')
    .eq('status', 'queued')
    .gte('scheduled_at', rangeStartIso)
    .lt('scheduled_at', rangeEndIso)
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest queued item for EST day: ${error.message}`);
  }

  return data;
};
