/**
 * Coerces JSON/JSONB values to a plain object for stable API responses.
 * `null`, `undefined`, arrays, and primitives become `{}`.
 *
 * @param value - Raw value from Postgres or request bodies
 */
export const coerceJsonObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};
