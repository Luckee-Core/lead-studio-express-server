export type RelativeCalendarDayHint = 'yesterday' | 'today';

/**
 * Detects simple relative day phrases in a free-text work log message.
 *
 * @param message - User-authored studio chat message.
 */
export const inferRelativeCalendarDayFromMessage = (
  message: string,
): RelativeCalendarDayHint | null => {
  const lower = message.toLowerCase();

  if (
    /\byesterday\b/.test(lower) ||
    /\blast night\b/.test(lower) ||
    /\bprevious day\b/.test(lower) ||
    /\bthe day before\b/.test(lower) ||
    /\ba day ago\b/.test(lower)
  ) {
    return 'yesterday';
  }

  if (
    /\btoday\b/.test(lower) ||
    /\bthis morning\b/.test(lower) ||
    /\bthis afternoon\b/.test(lower) ||
    /\bthis evening\b/.test(lower) ||
    /\bright now\b/.test(lower)
  ) {
    return 'today';
  }

  return null;
};
