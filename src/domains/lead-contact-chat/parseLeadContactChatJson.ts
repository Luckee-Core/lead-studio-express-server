export type LeadContactChatAiPayload = {
  content: string;
};

const tryParseObject = (s: string): LeadContactChatAiPayload | null => {
  try {
    const parsed = JSON.parse(s) as { content?: unknown };
    if (typeof parsed.content !== 'string') {
      return null;
    }
    const content = parsed.content.trim();
    if (!content) {
      return null;
    }
    return { content };
  } catch {
    return null;
  }
};

/**
 * Parse AI JSON payload for lead-contact chat.
 * Handles raw JSON, ```json fenced``` blocks, leading prose + JSON, and plain-text replies.
 */
export const parseLeadContactChatJson = (
  raw: string,
): LeadContactChatAiPayload | null => {
  const trimmed = raw.trim();
  let parsed = tryParseObject(trimmed);
  if (parsed) {
    return parsed;
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    parsed = tryParseObject(fence[1].trim());
    if (parsed) {
      return parsed;
    }
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    parsed = tryParseObject(trimmed.slice(start, end + 1));
    if (parsed) {
      return parsed;
    }
  }

  // Model sometimes ignores JSON-only instructions and returns plain coaching text.
  if (trimmed.length > 0 && !trimmed.includes('{')) {
    return { content: trimmed };
  }

  return null;
};
