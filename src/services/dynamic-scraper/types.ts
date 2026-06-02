export type PageMetadata = {
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
};

/**
 * One URL result: extracted content and/or a per-URL error (stored for audit).
 */
export type PlaywrightScrapedPage = {
  url: string;
  title: string;
  /** Plain text from rendered body; passed to AI as markdown downstream. */
  text: string;
  metadata: PageMetadata;
  error?: string;
};
