/**
 * Anchor time for chaining a new queue item on a given America/New_York calendar day.
 */

import { DateTime } from 'luxon';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLatestQueuedItemForEstCalendarDay } from '../../data/lead-contact-email-queue';

const EST_ZONE = 'America/New_York';

/**
 * Computes where to chain the next queued send for a target Eastern calendar day.
 * - Same day as "now" in Eastern: after the latest item that day, or after now (whichever is later), or now if empty.
 * - Future Eastern day: after the latest item that day, or 8:00 AM Eastern if empty.
 *
 * @param supabase - Supabase client
 * @param targetDayEst - Any instant on the target calendar day in Eastern time
 * @param nowEST - Current instant in Eastern time
 * @returns Anchor Date (UTC) before random offset and business-hours enforcement
 * @throws Error if the target day is strictly before today's Eastern calendar start
 */
export const getStartingTimeForEstQueueDay = async (
  supabase: SupabaseClient,
  targetDayEst: DateTime,
  nowEST: DateTime
): Promise<Date> => {
  const targetStart = targetDayEst.setZone(EST_ZONE).startOf('day');
  const todayStart = nowEST.setZone(EST_ZONE).startOf('day');

  if (targetStart < todayStart) {
    throw new Error('Cannot schedule on a past calendar day (Eastern)');
  }

  const isToday = targetStart.hasSame(nowEST, 'day');
  const nowTime = nowEST.toJSDate();
  const latest = await getLatestQueuedItemForEstCalendarDay(
    supabase,
    targetDayEst.setZone(EST_ZONE)
  );

  if (isToday) {
    if (latest) {
      const latestScheduledTime = new Date(latest.scheduled_at);
      return latestScheduledTime > nowTime ? latestScheduledTime : nowTime;
    }
    return nowTime;
  }

  if (latest) {
    return new Date(latest.scheduled_at);
  }

  return targetStart
    .set({ hour: 8, minute: 0, second: 0, millisecond: 0 })
    .toJSDate();
};
