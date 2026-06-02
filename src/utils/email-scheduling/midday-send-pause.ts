/**
 * Deterministic daily “midday send pause” for lead email queue batch sends.
 *
 * Picks one 60-minute window per calendar day in America/New_York, fully inside
 * 11:00–15:00 (11am–3pm). The slot is stable for the whole day (same across
 * restarts and cron ticks) without DB or filesystem state: hash(dateKey + seed).
 *
 * Only intended for POST …/process-due; manual process-next bypasses this.
 */

import { createHash } from 'crypto';
import { DateTime } from 'luxon';

const SCHED_TZ = 'America/New_York';
const PAUSE_ANCHOR_HOUR = 11;
const PAUSE_LAST_START_HOUR = 14;
const PAUSE_DURATION_MINUTES = 60;

/** Inclusive minute offsets from 11:00 (0 = 11:00, 180 = 14:00). */
const PAUSE_START_OFFSET_MAX = (PAUSE_LAST_START_HOUR - PAUSE_ANCHOR_HOUR) * 60;

const truthyEnv = (value: string | undefined): boolean => {
  const v = value?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
};

const falsyEnv = (value: string | undefined): boolean => {
  const v = value?.trim().toLowerCase();
  return v === '0' || v === 'false' || v === 'no';
};

/**
 * Whether midday send pause applies to process-due (default: true).
 * Opt out: LEAD_EMAIL_QUEUE_MIDDAY_PAUSE_DISABLED=true, or LEAD_EMAIL_QUEUE_MIDDAY_PAUSE_ENABLED=false.
 */
export const isMiddaySendPauseEnabled = (): boolean => {
  if (truthyEnv(process.env.LEAD_EMAIL_QUEUE_MIDDAY_PAUSE_DISABLED)) {
    return false;
  }
  if (falsyEnv(process.env.LEAD_EMAIL_QUEUE_MIDDAY_PAUSE_ENABLED)) {
    return false;
  }
  return true;
};

/**
 * Seed for daily slot derivation (env LEAD_EMAIL_QUEUE_MIDDAY_PAUSE_SEED).
 * Change this to reshuffle future days’ windows without code changes.
 */
const getMiddayPauseSeed = (): string =>
  process.env.LEAD_EMAIL_QUEUE_MIDDAY_PAUSE_SEED?.trim() ||
  'lead-contact-email-queue-midday-pause';

const offsetMinutesForDateKey = (dateKey: string): number => {
  const digest = createHash('sha256')
    .update(`${getMiddayPauseSeed()}|${dateKey}`, 'utf8')
    .digest();
  const n = digest.readUInt32BE(0);
  return n % (PAUSE_START_OFFSET_MAX + 1);
};

export type MiddaySendPauseInfo = {
  enabled: boolean;
  active: boolean;
  dateKey: string;
  windowStartIso: string | null;
  windowEndIso: string | null;
};

/**
 * Returns pause configuration for “now” in America/New_York.
 */
export const getMiddaySendPauseInfo = (): MiddaySendPauseInfo => {
  if (!isMiddaySendPauseEnabled()) {
    return {
      enabled: false,
      active: false,
      dateKey: '',
      windowStartIso: null,
      windowEndIso: null,
    };
  }

  const nowEST = DateTime.now().setZone(SCHED_TZ);
  const dateKey = nowEST.toFormat('yyyy-MM-dd');
  const offset = offsetMinutesForDateKey(dateKey);
  const windowStart = nowEST
    .startOf('day')
    .set({
      hour: PAUSE_ANCHOR_HOUR,
      minute: 0,
      second: 0,
      millisecond: 0,
    })
    .plus({ minutes: offset });
  const windowEnd = windowStart.plus({ minutes: PAUSE_DURATION_MINUTES });
  const active = nowEST >= windowStart && nowEST < windowEnd;

  return {
    enabled: true,
    active,
    dateKey,
    windowStartIso: windowStart.toISO(),
    windowEndIso: windowEnd.toISO(),
  };
};
