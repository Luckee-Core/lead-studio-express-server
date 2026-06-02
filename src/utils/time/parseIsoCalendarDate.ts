/**
 * Validates and normalizes a `YYYY-MM-DD` calendar string (UTC calendar math only).
 *
 * @param value - Raw string from user or model output.
 * @returns Trimmed `YYYY-MM-DD` when valid, otherwise `null`.
 */
export const parseIsoCalendarDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const [year, month, day] = trimmed.split('-').map((part) => Number(part));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return trimmed;
};
