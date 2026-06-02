/**
 * Minimal post fields for activity scoring and persistence: when it was published, optional
 * link-share title, and caption/body text only (no URLs, media, or engagement).
 */
export type NormalizedFacebookPostForActivity = {
  publishedAt: string | null;
  title: string | null;
  text: string;
};

const collectPostObjects = (root: unknown): unknown[] => {
  if (Array.isArray(root)) return root;
  if (root && typeof root === 'object') {
    const o = root as Record<string, unknown>;
    const keys = ['posts', 'data', 'items', 'results', 'feed'] as const;
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

/**
 * Flattens scraper output (Apify dataset array or n8n wrapper) into raw post-like objects.
 */
export const extractFacebookPostLikeObjectsFromScraperData = (data: unknown): unknown[] => {
  if (data === null || data === undefined) return [];
  const direct = collectPostObjects(data);
  if (direct.length > 0) return direct;
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if ('data' in o && o.data !== undefined) {
      return collectPostObjects(o.data);
    }
  }
  return [];
};

const pickCaptionTextFromPost = (o: Record<string, unknown>): string => {
  const text =
    (typeof o.message === 'string' && o.message) ||
    (typeof o.text === 'string' && o.text) ||
    (typeof o.story === 'string' && o.story) ||
    (typeof o.content === 'string' && o.content) ||
    (typeof o.body === 'string' && o.body) ||
    (typeof o.caption === 'string' && o.caption) ||
    '';
  const trimmed = text.trim();
  if (trimmed) return trimmed.slice(0, 2000);
  const desc =
    typeof o.previewDescription === 'string' && o.previewDescription.trim()
      ? o.previewDescription.trim().slice(0, 2000)
      : '';
  return desc;
};

const pickTitleFromPost = (o: Record<string, unknown>): string | null => {
  const raw =
    (typeof o.previewTitle === 'string' && o.previewTitle.trim()) ||
    (typeof o.title === 'string' && o.title.trim()) ||
    '';
  return raw ? raw.slice(0, 500) : null;
};

/** Values below this are treated as Unix seconds (Apify / Facebook often use s, JS Date wants ms). */
const UNIX_SECONDS_VS_MS_THRESHOLD = 1e12;

const parseNumericEpochToIso = (n: number): string | null => {
  if (!Number.isFinite(n) || n <= 0) return null;
  const ms = n < UNIX_SECONDS_VS_MS_THRESHOLD ? n * 1000 : n;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const parseStringDateToIso = (raw: string): string | null => {
  const t = raw.trim();
  if (!t) return null;
  const parsed = Date.parse(t);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
};

/**
 * Picks a stable ISO time for activity scoring. Apify facebook-posts items use `time` (ISO) and
 * `timestamp` (Unix seconds); prefer strings before numbers so we never feed seconds into `Date(ms)`.
 */
const pickPublishedAt = (o: Record<string, unknown>): string | null => {
  const stringKeys = [
    'time',
    'created_time',
    'createdTime',
    'date',
    'postedAt',
    'postTime',
  ] as const;
  for (const k of stringKeys) {
    const v = o[k];
    if (typeof v === 'string') {
      const iso = parseStringDateToIso(v);
      if (iso) return iso;
    }
  }

  const numericKeys = ['timestamp', 'created_time', 'time', 'date'] as const;
  for (const k of numericKeys) {
    const v = o[k];
    if (typeof v === 'number') {
      const iso = parseNumericEpochToIso(v);
      if (iso) return iso;
    }
  }

  return null;
};

/**
 * Maps one post-like object to a stable shape for the activity prompt.
 */
export const normalizeFacebookPostItemForActivity = (
  post: unknown
): NormalizedFacebookPostForActivity | null => {
  if (post === null || post === undefined) return null;
  if (typeof post === 'string') {
    const t = post.trim();
    if (!t) return null;
    return { publishedAt: null, title: null, text: t.slice(0, 2000) };
  }
  if (typeof post !== 'object') return null;
  const o = post as Record<string, unknown>;
  const title = pickTitleFromPost(o);
  const text = pickCaptionTextFromPost(o);
  if (!text && !title) return null;
  return {
    publishedAt: pickPublishedAt(o),
    title,
    text,
  };
};

/**
 * Builds a list of normalized posts from arbitrary Apify / webhook JSON (max `limit` items).
 */
export const normalizeFacebookPostsForActivityFromScraperData = (
  data: unknown,
  limit = 12
): NormalizedFacebookPostForActivity[] => {
  const objects = extractFacebookPostLikeObjectsFromScraperData(data);
  const out: NormalizedFacebookPostForActivity[] = [];
  for (const p of objects) {
    const n = normalizeFacebookPostItemForActivity(p);
    if (n) out.push(n);
    if (out.length >= limit) break;
  }
  return out;
};
