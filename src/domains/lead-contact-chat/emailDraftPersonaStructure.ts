const QUOTE_OPEN_CLASS = `['\`'\u2018\u201c]`;
const QUOTE_CLOSE_CLASS = `['\`'\u2019\u201d]`;

/**
 * Compares two lines for equality ignoring case, extra spaces, and trailing punctuation.
 */
const normalizeComparableLine = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,!]+$/, '');

/**
 * If Voice / Do / Tone name a fixed greeting in quotes (e.g. always open with 'Hola hola'),
 * returns that exact string for prompts and post-processing.
 */
const extractQuotedOpeningFromText = (text: string): string | null => {
  const patterns = [
    new RegExp(
      `\\balways\\s+open\\s+with\\s+${QUOTE_OPEN_CLASS}\\s*([^\\r\\n]+?)\\s*${QUOTE_CLOSE_CLASS}`,
      'i',
    ),
    new RegExp(
      `\\blead\\s+with\\s+${QUOTE_OPEN_CLASS}\\s*([^\\r\\n]+?)\\s*${QUOTE_CLOSE_CLASS}`,
      'i',
    ),
    new RegExp(
      `\\bopen\\s+with\\s+${QUOTE_OPEN_CLASS}\\s*([^\\r\\n]+?)\\s*${QUOTE_CLOSE_CLASS}`,
      'i',
    ),
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    const m = re.exec(text);
    const raw = m?.[1]?.trim();
    if (raw) {
      return raw;
    }
  }
  return null;
};

/**
 * Returns the mandatory first line of the email body derived from persona, or null if none.
 */
export const getMandatoryOpeningLineFromPersona = (
  persona: Record<string, string>,
): string | null => {
  const priorityText = [persona.voice, persona.dos, persona.tone].filter(Boolean).join('\n');
  const fullPersonaText = Object.values(persona)
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join('\n');

  for (const text of [priorityText, fullPersonaText]) {
    if (!text.trim()) continue;
    const quoted = extractQuotedOpeningFromText(text);
    if (quoted) {
      return quoted;
    }
  }

  for (const text of [priorityText, fullPersonaText]) {
    if (/\bhola\s+hola\b/i.test(text)) {
      const hit = text.match(/\bhola\s+hola[.,!]?/i);
      if (hit) {
        return hit[0].replace(/\s+/g, ' ').trim();
      }
      return 'Hola hola.';
    }
  }
  return null;
};

/**
 * Returns the mandatory final line (sign-off) from persona, or null if not set.
 */
export const getMandatorySignOffLineFromPersona = (
  persona: Record<string, string>,
): string | null => {
  const line = persona.signOff?.trim();
  return line ? line : null;
};

const GENERIC_OPENER_LINE =
  /^(hey there,?|hi there,?|hello,|hey,|hi,|good morning,|good afternoon,|good evening,|reaching out\b)/i;

const TRAILING_GENERIC_CLOSING = /^(thanks\.?|best(\s+regards)?\.?|cheers\.?|talk soon\.?|let me know[^.]*\.?|looking forward[^.]*\.?|warm regards\.?|kind regards\.?)$/i;

/**
 * Removes leading blank lines and generic greeting lines from plain text.
 */
const stripLeadingGenericGreetings = (text: string): string => {
  const lines = text.split(/\r?\n/);
  while (lines.length > 0) {
    const t = lines[0].trim();
    if (!t) {
      lines.shift();
      continue;
    }
    if (GENERIC_OPENER_LINE.test(t)) {
      lines.shift();
      continue;
    }
    break;
  }
  return lines.join('\n').trimStart();
};

/**
 * Drops trailing blank lines and generic one-line closings (not the persona sign-off).
 */
const stripTrailingGenericClosings = (lines: string[]): string[] => {
  const out = [...lines];
  while (out.length > 0) {
    const t = out[out.length - 1].trim();
    if (!t) {
      out.pop();
      continue;
    }
    if (TRAILING_GENERIC_CLOSING.test(t)) {
      out.pop();
      continue;
    }
    break;
  }
  return out;
};

/**
 * Ensures mandatory opening and sign-off from the email persona are present in the plain-text body.
 * Runs after the model response so persona structure cannot be dropped in JSON output.
 */
export const applyMandatoryStructureToPlainEmailBody = (
  body: string,
  persona: Record<string, string>,
): string => {
  let out = body.replace(/^\uFEFF/, '').trimEnd();
  const opening = getMandatoryOpeningLineFromPersona(persona);
  const signOff = getMandatorySignOffLineFromPersona(persona);

  if (opening) {
    const restAfterStrip = stripLeadingGenericGreetings(out);
    const lines = restAfterStrip.split(/\r?\n/);
    let i = 0;
    while (i < lines.length && !lines[i].trim()) {
      i += 1;
    }
    const firstLine = lines[i]?.trim() ?? '';
    const openingOk =
      firstLine &&
      normalizeComparableLine(firstLine) === normalizeComparableLine(opening);
    if (!openingOk) {
      out = `${opening}\n\n${restAfterStrip}`.trim();
    } else {
      out = restAfterStrip.trim();
    }
  }

  if (signOff) {
    const lines = out.split(/\r?\n/);
    const trimmed = stripTrailingGenericClosings(lines);
    const nonEmpty = trimmed.map((l) => l.trim()).filter(Boolean);
    const lastLine = nonEmpty.length > 0 ? nonEmpty[nonEmpty.length - 1] : '';
    const signOffOk =
      lastLine &&
      normalizeComparableLine(lastLine) === normalizeComparableLine(signOff);
    if (!signOffOk) {
      out = `${trimmed.join('\n').trimEnd()}\n\n${signOff}`.trimEnd();
    } else {
      out = trimmed.join('\n').trimEnd();
    }
  }

  return out;
};

/**
 * Replaces Unicode em dash, en dash, and minus used as a dash with ASCII-safe punctuation per draft rules.
 */
export const normalizePlainEmailTypography = (text: string): string => {
  let out = text
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, ', ')
    .replace(/\u2212/g, '-');
  out = out.replace(/,\s*,+/g, ',');
  return out;
};
