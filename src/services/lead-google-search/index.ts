import type { Request, Response } from 'express';
import { getSerpProfilePlatformFromBody } from '../lead-research-shared';
import { runLeadGoogleSearchFacebook } from './facebook';
import { runLeadGoogleSearchInstagram } from './instagram';
import { runLeadGoogleSearchLinkedin } from './linkedin';

/**
 * Legacy compatibility handler for POST /api/services/lead-google-search.
 *
 * Prefer explicit endpoints:
 * - /api/services/lead-google-search/facebook
 * - /api/services/lead-google-search/instagram
 * - /api/services/lead-google-search/linkedin
 */
export const runLeadGoogleSearch = async (req: Request, res: Response): Promise<void> => {
  const platform = getSerpProfilePlatformFromBody(req);

  if (platform === 'facebook') {
    await runLeadGoogleSearchFacebook(req, res);
    return;
  }

  if (platform === 'instagram') {
    await runLeadGoogleSearchInstagram(req, res);
    return;
  }

  if (platform === 'linkedin') {
    await runLeadGoogleSearchLinkedin(req, res);
    return;
  }

  res.status(400).json({
    success: false,
    error: 'platform_required',
    message: 'Provide platform: facebook | instagram | linkedin',
  });
};

export { runLeadGoogleSearchFacebook } from './facebook';
export { runLeadGoogleSearchInstagram } from './instagram';
export { runLeadGoogleSearchLinkedin } from './linkedin';
