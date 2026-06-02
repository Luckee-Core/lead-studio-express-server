import type { FacebookActivityScoreResult } from './types';

const CONFIDENCE = new Set(['low', 'medium', 'high']);

/**
 * Parses model JSON into a Facebook activity score result.
 */
export const parseFacebookActivityScoreResponse = (
  raw: string
): { ok: true; data: FacebookActivityScoreResult } | { ok: false; error: string } => {
  let text = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(text);
  if (fence) {
    text = fence[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: 'AI response was not valid JSON' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'AI response root must be an object' };
  }

  const o = parsed as Record<string, unknown>;
  const scoreRaw = o.activityScore;
  if (typeof scoreRaw !== 'number' || !Number.isFinite(scoreRaw)) {
    return { ok: false, error: 'Missing or invalid activityScore' };
  }
  const activityScore = Math.round(scoreRaw);
  if (activityScore < 0 || activityScore > 100) {
    return { ok: false, error: 'activityScore must be between 0 and 100' };
  }

  const confidenceRaw = o.confidence;
  const confidence =
    typeof confidenceRaw === 'string' && CONFIDENCE.has(confidenceRaw)
      ? (confidenceRaw as FacebookActivityScoreResult['confidence'])
      : 'medium';

  const postingPattern =
    typeof o.postingPattern === 'string' ? o.postingPattern.trim().slice(0, 500) : 'unknown';
  const evidence =
    typeof o.evidence === 'string' ? o.evidence.trim().slice(0, 2000) : '';
  const limitations =
    typeof o.limitations === 'string' ? o.limitations.trim().slice(0, 2000) : '';

  return {
    ok: true,
    data: {
      activityScore,
      confidence,
      postingPattern: postingPattern || 'unknown',
      evidence,
      limitations,
    },
  };
};
