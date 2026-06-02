import { Request, Response } from 'express';
import { getManagedAnthropicClient } from '../../../services/ai/anthropic-client';
import { processResolveSerpProfiles } from '../../../ai/google-search/resolve-serp-profiles';
import type { SerpResultRow } from '../../../ai/google-search/resolve-serp-profiles';

const HANDLER_LOG = '[google-search:api]';

/**
 * POST /api/google-search/resolve-profiles
 * Body: { businessName, city, state, results: { title, url }[] }
 */
export const resolveProfilesHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startedAt = Date.now();

  try {
    const { businessName, city, state, results } = req.body as {
      businessName?: string;
      city?: string;
      state?: string;
      results?: unknown;
    };

    console.log(`${HANDLER_LOG} ${requestId} POST /api/google-search/resolve-profiles`, {
      hasBody: Boolean(req.body),
    });

    if (!businessName?.trim() || !city?.trim() || !state?.trim()) {
      res.status(400).json({
        success: false,
        error: 'businessName, city, and state are required',
      });
      return;
    }

    if (!Array.isArray(results) || results.length === 0) {
      res.status(400).json({
        success: false,
        error: 'results must be a non-empty array of { title, url }',
      });
      return;
    }

    const normalized: SerpResultRow[] = [];
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const title = typeof r.title === 'string' ? r.title.trim() : '';
      const url = typeof r.url === 'string' ? r.url.trim() : '';
      if (title.length > 0 && url.length > 0) {
        normalized.push({ title, url });
      }
    }

    if (normalized.length === 0) {
      res.status(400).json({
        success: false,
        error: 'results must contain at least one row with non-empty title and url',
      });
      return;
    }

    const anthropic = getManagedAnthropicClient();
    if (!anthropic) {
      res.status(503).json({
        success: false,
        error: 'Anthropic is not configured (ANTHROPIC_API_KEY)',
      });
      return;
    }

    const payload = {
      businessName: businessName.trim(),
      city: city.trim(),
      state: state.trim(),
      results: normalized,
    };

    console.log(`${HANDLER_LOG} ${requestId} resolve-profiles start rows=${normalized.length}`);

    const out = await processResolveSerpProfiles(anthropic, payload);

    const durationMs = Date.now() - startedAt;
    console.log(
      `${HANDLER_LOG} ${requestId} resolve-profiles ok=${out.success} durationMs=${durationMs}`
    );

    if (!out.success) {
      res.status(422).json({
        success: false,
        error: out.error || 'Profile resolution failed',
      });
      return;
    }

    res.json({
      success: true,
      profiles: out.profiles,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`${HANDLER_LOG} ${requestId} error after ${Date.now() - startedAt}ms`, err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
