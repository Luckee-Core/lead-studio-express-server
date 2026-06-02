/**
 * Best-effort city/state from lead.address for Google SERP (fallbacks via env).
 */
export const parseAddressForSerp = (address: string | null | undefined): {
  city: string;
  state: string;
} => {
  const raw = (address || '').trim();
  const defaultState = process.env.LEAD_RESEARCH_DEFAULT_STATE || 'US';
  const defaultCity = process.env.LEAD_RESEARCH_DEFAULT_CITY || 'Philadelphia';
  const normalizeCity = (city: string): string => {
    if (!city) return defaultCity;
    return city.toLowerCase() === 'unknown' ? defaultCity : city;
  };
  if (!raw) {
    return {
      city: defaultCity,
      state: defaultState,
    };
  }
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const stateMatch = last.match(/\b([A-Z]{2})\b/);
    const state = stateMatch ? stateMatch[1] : defaultState;
    const city = parts[parts.length - 2] || parts[0];
    return { city: normalizeCity(city), state };
  }
  return { city: normalizeCity(parts[0] || ''), state: defaultState };
};
