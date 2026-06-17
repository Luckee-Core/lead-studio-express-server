import type { GenerateColdEmailOfferingFromNotesResult } from './types';

const stripCodeFences = (raw: string): string => {
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/```\s*$/, '');
  return text.trim();
};

const emptyError = (error: string): GenerateColdEmailOfferingFromNotesResult => ({
  success: false,
  title: null,
  hook: null,
  description: null,
  error,
  model: '',
});

/**
 * Parse AI JSON into title, hook, and description.
 */
export const parseGenerateColdEmailOfferingFromNotesResponse = (
  aiResponse: string,
): GenerateColdEmailOfferingFromNotesResult => {
  try {
    const text = stripCodeFences(aiResponse);
    const parsed = JSON.parse(text) as Record<string, unknown>;

    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const hook = typeof parsed.hook === 'string' ? parsed.hook.trim() : '';
    const description =
      typeof parsed.description === 'string' ? parsed.description.trim() : '';

    if (!title || !hook || !description) {
      return emptyError('Missing or invalid title, hook, or description in JSON');
    }

    return {
      success: true,
      title,
      hook,
      description,
      model: '',
    };
  } catch (error) {
    return emptyError(error instanceof Error ? error.message : 'Failed to parse JSON');
  }
};
