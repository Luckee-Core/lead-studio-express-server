/**
 * Business hours gate (default 6:00–18:00 local in LEAD_RESEARCH_BUSINESS_TZ).
 */
export const isWithinBusinessHours = (): boolean => {
  const tz = process.env.LEAD_RESEARCH_BUSINESS_TZ || 'America/New_York';
  const hourStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: tz,
  }).format(new Date());
  const hour = Number.parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return true;
  return hour >= 6 && hour < 18;
};
