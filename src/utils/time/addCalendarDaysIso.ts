import { parseIsoCalendarDate } from './parseIsoCalendarDate';

/**
 * Adds whole calendar days to a `YYYY-MM-DD` string using UTC date parts (no clock/DST).
 *
 * @param ymd - Valid `YYYY-MM-DD` string.
 * @param deltaDays - Positive or negative day offset.
 */
export const addCalendarDaysIso = (ymd: string, deltaDays: number): string => {
  const base = parseIsoCalendarDate(ymd);
  if (!base) {
    throw new Error('Invalid YYYY-MM-DD');
  }

  const [year, month, day] = base.split('-').map((part) => Number(part));
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return shifted.toISOString().slice(0, 10);
};
