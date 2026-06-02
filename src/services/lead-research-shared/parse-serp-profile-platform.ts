import type { Request } from 'express';

/** Manual lead Google SERP: one search + AI per platform. */
export type SerpProfilePlatform = 'facebook' | 'instagram' | 'linkedin';

const PLATFORMS: SerpProfilePlatform[] = ['facebook', 'instagram', 'linkedin'];

/**
 * JSON body `platform` for POST /api/services/lead-google-search (manual only; required with `leadId`).
 */
export const getSerpProfilePlatformFromBody = (req: Request): SerpProfilePlatform | null => {
  const body = req.body;
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { platform?: unknown }).platform;
  if (typeof raw !== 'string') return null;
  const t = raw.trim().toLowerCase();
  if (!PLATFORMS.includes(t as SerpProfilePlatform)) return null;
  return t as SerpProfilePlatform;
};
