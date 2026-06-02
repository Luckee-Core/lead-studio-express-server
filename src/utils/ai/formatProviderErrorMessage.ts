/**
 * Normalize Anthropic (and similar) SDK errors into short, UI-safe copy.
 */
export const formatProviderErrorMessage = (err: unknown): string => {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('credit balance') || lower.includes('too low to access the anthropic api')) {
    return (
      'Anthropic API credits are exhausted. Add credits under Plans & Billing in your Anthropic ' +
      'account, then try again.'
    );
  }

  const braceStart = raw.indexOf('{');
  if (braceStart !== -1) {
    const slice = raw.slice(braceStart);
    try {
      const parsed = JSON.parse(slice) as {
        error?: { message?: string; type?: string };
      };
      const nested = parsed?.error;
      const m = typeof nested?.message === 'string' ? nested.message : '';
      if (m) {
        const ml = m.toLowerCase();
        if (ml.includes('credit balance') || ml.includes('too low to access')) {
          return (
            'Anthropic API credits are exhausted. Add credits under Plans & Billing in your Anthropic ' +
            'account, then try again.'
          );
        }
        return m;
      }
    } catch {
      /* use raw below */
    }
  }

  if (raw.length > 320) {
    return `${raw.slice(0, 317)}…`;
  }

  return raw;
};
