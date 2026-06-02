import fs from 'fs';
import path from 'path';

const VOICE_GUIDE_MAX_CHARS = 24_000;

/**
 * Loads the canonical writer voice/style markdown from repo `data/` (truncated for token budget).
 */
export const readWritersVoiceGuideMarkdown = (): string => {
  const filePath = path.join(process.cwd(), 'data', 'matt_unified_voice_and_style_guide.md');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (raw.length <= VOICE_GUIDE_MAX_CHARS) return raw;
    return `${raw.slice(0, VOICE_GUIDE_MAX_CHARS)}\n\n[…truncated for context window…]`;
  } catch {
    return '';
  }
};
