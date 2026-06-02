/**
 * True when PostgREST/Postgres reports `facebook_google_search.request_source` is missing
 * (migration 126 not applied yet).
 */
export const isFacebookGoogleSearchRequestSourceColumnMissingError = (message: string): boolean => {
  const m = message.toLowerCase();
  return (
    m.includes('request_source') &&
    (m.includes('does not exist') || m.includes('unknown column') || m.includes('schema cache'))
  );
};
