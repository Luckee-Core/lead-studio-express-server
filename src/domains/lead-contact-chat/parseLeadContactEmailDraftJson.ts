export type LeadContactEmailDraftAiPayload = {
  subject: string;
  body: string;
};

const tryParse = (s: string): LeadContactEmailDraftAiPayload | null => {
  try {
    const parsed = JSON.parse(s) as { subject?: unknown; body?: unknown };
    if (typeof parsed.subject !== 'string' || typeof parsed.body !== 'string') {
      return null;
    }
    const subject = parsed.subject.trim();
    const body = parsed.body.trim();
    if (!subject || !body) {
      return null;
    }
    return { subject, body };
  } catch {
    return null;
  }
};

/**
 * Parse AI JSON for lead-contact email draft (subject + body).
 */
export const parseLeadContactEmailDraftJson = (
  raw: string,
): LeadContactEmailDraftAiPayload | null => {
  const trimmed = raw.trim();
  let parsed = tryParse(trimmed);
  if (parsed) {
    return parsed;
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    parsed = tryParse(fence[1].trim());
    if (parsed) {
      return parsed;
    }
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    parsed = tryParse(trimmed.slice(start, end + 1));
    if (parsed) {
      return parsed;
    }
  }

  return null;
};
