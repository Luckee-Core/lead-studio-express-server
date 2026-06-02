import type { BatchAutoCategorizeAssignment, BatchAutoCategorizeStructuredResponse } from './types';

/**
 * Strip optional markdown code fences and parse batch categorization JSON.
 */
export const parseBatchAutoCategorizeResponse = (
  raw: string
): { ok: true; data: BatchAutoCategorizeStructuredResponse } | { ok: false; error: string } => {
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

  const assignmentsRaw = (parsed as { assignments?: unknown }).assignments;
  if (!Array.isArray(assignmentsRaw)) {
    return { ok: false, error: 'Missing assignments array' };
  }

  const assignments: BatchAutoCategorizeAssignment[] = [];
  for (let i = 0; i < assignmentsRaw.length; i += 1) {
    const row = assignmentsRaw[i];
    if (!row || typeof row !== 'object') {
      return { ok: false, error: `Invalid assignment at index ${i}` };
    }
    const leadId = typeof (row as { leadId?: unknown }).leadId === 'string'
      ? (row as { leadId: string }).leadId.trim()
      : '';
    if (!leadId) {
      return { ok: false, error: `Missing leadId at index ${i}` };
    }
    const cat = (row as { categoryId?: unknown }).categoryId;
    let categoryId: string | null = null;
    if (cat === null || cat === undefined) {
      categoryId = null;
    } else if (typeof cat === 'string' && cat.trim()) {
      categoryId = cat.trim();
    } else {
      return { ok: false, error: `Invalid categoryId for lead ${leadId}` };
    }
    assignments.push({ leadId, categoryId });
  }

  return { ok: true, data: { assignments } };
};
