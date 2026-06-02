/**
 * Get a timestamp N units ago from now
 * 
 * @param amount - Number of units
 * @param unit - Time unit ('hours', 'days', 'minutes')
 * @returns ISO timestamp string
 * 
 * @example
 * getTimeAgo(24, 'hours') // "2026-01-01T00:00:00.000Z"
 * getTimeAgo(7, 'days')   // "2025-12-26T00:00:00.000Z"
 */
export const getTimeAgo = (
  amount: number,
  unit: 'hours' | 'days' | 'minutes'
): string => {
  const now = new Date();
  const ms = {
    minutes: amount * 60 * 1000,
    hours: amount * 60 * 60 * 1000,
    days: amount * 24 * 60 * 60 * 1000,
  };
  return new Date(now.getTime() - ms[unit]).toISOString();
};

