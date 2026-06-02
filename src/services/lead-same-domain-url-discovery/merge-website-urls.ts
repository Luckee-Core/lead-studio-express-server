/**
 * Merge discovered URLs into existing `website_urls` with de-duplication.
 */
export const mergeWebsiteUrls = (
  existing: string[] | undefined,
  discovered: string[]
): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };
  for (const url of existing ?? []) {
    if (typeof url === 'string') add(url);
  }
  for (const url of discovered) {
    add(url);
  }
  return out;
};
