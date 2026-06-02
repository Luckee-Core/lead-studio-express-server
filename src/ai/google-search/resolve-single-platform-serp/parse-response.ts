import type { SerpProfilePlatform } from '../../../services/lead-research-shared/parse-serp-profile-platform';
import type { ResolveSinglePlatformSerpResponse } from './types';

const stripCodeFences = (raw: string): string => {
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/```\s*$/, '');
  return text.trim().replace(/,(\s*})/g, '$1').replace(/,(\s*])/g, '$1');
};

const normalizeNullableUrl = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t || t.toLowerCase() === 'null' || t.toLowerCase() === 'none') return null;
  try {
    const u = new URL(t.startsWith('http') ? t : `https://${t}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
};

const hostMatchesPlatform = (host: string, platform: SerpProfilePlatform): boolean => {
  const h = host.toLowerCase();
  if (platform === 'facebook') {
    return (
      h.includes('facebook.com') ||
      h === 'fb.com' ||
      h.endsWith('.fb.com')
    );
  }
  if (platform === 'instagram') {
    return h.includes('instagram.com');
  }
  return h.includes('linkedin.com');
};

/**
 * Parse Haiku JSON `{ url: string | null }` and enforce host for the target platform.
 */
export const parseResolveSinglePlatformSerpResponse = (
  aiResponse: string,
  platform: SerpProfilePlatform
): Pick<ResolveSinglePlatformSerpResponse, 'success' | 'url' | 'error'> => {
  try {
    const text = stripCodeFences(aiResponse);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    let url = normalizeNullableUrl(parsed.url ?? parsed.profileUrl ?? parsed.profile_url);
    if (url) {
      try {
        const host = new URL(url).hostname;
        if (!hostMatchesPlatform(host, platform)) {
          url = null;
        }
      } catch {
        url = null;
      }
    }
    return { success: true, url };
  } catch (error) {
    return {
      success: false,
      url: null,
      error: error instanceof Error ? error.message : 'Failed to parse AI response',
    };
  }
};
