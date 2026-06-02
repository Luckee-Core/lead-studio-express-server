/** Max URLs scraped in one run (after dedupe). */
export const MAX_URLS_PER_RUN = 5;

/** Playwright page.goto timeout. */
export const NAVIGATION_TIMEOUT_MS = 30_000;

/** Cap extracted text per page for storage / AI context. */
export const MAX_TEXT_CHARS_PER_PAGE = 500_000;
