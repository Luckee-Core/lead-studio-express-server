/**
 * Returns true when `raw` parses as an `http:` or `https:` URL (matches qr-code-generator validation).
 */
export const canEncodeAsHttpHttpsUrl = (raw: string): boolean => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};
