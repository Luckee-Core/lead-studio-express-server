/**
 * Response parser for Business Coach AI responses
 * Ported from Firebase Cloud Functions
 */

export interface MentorResponseBodyItem {
  type: string;
  content?: string;
  id?: string;
  items?: any[];
}

export interface MentorResponseSection {
  header: string;
  summary?: string;
  body: MentorResponseBodyItem[];
}

export interface RawMentorResponse {
  structured: MentorResponseSection[];
}

// Robust parser with multiple fallback strategies
export function parseApiResponse(responseString: string): RawMentorResponse | null {
  // Input validation
  if (!responseString || typeof responseString !== 'string') {
    console.warn('Invalid input to parseApiResponse:', responseString);
    return null;
  }

  // Strategy 1: Try direct JSON.parse
  try {
    const parsed = JSON.parse(responseString);
    if (isValidMentorResponse(parsed)) {
      return normalizeResponse(parsed);
    }
  } catch (error) {
    console.warn('Direct JSON parse failed:', error);
  }

  // Strategy 2: Try cleaning common issues
  try {
    const cleaned = cleanJsonString(responseString);
    const parsed = JSON.parse(cleaned);
    if (isValidMentorResponse(parsed)) {
      return normalizeResponse(parsed);
    }
  } catch (error) {
    console.warn('Cleaned JSON parse failed:', error);
  }

  // Strategy 3: Extract JSON from mixed content
  try {
    const extracted = extractJsonFromString(responseString);
    if (extracted) {
      const parsed = JSON.parse(extracted);
      if (isValidMentorResponse(parsed)) {
        return normalizeResponse(parsed);
      }
    }
  } catch (error) {
    console.warn('JSON extraction failed:', error);
  }

  // Strategy 4: Try to fix truncated JSON
  try {
    const fixed = fixTruncatedJson(responseString);
    if (fixed) {
      const parsed = JSON.parse(fixed);
      if (isValidMentorResponse(parsed)) {
        return normalizeResponse(parsed);
      }
    }
  } catch (error) {
    console.warn('Truncated JSON fix failed:', error);
  }

  // Strategy 5: Try to detect and transform wrong format (e.g., "analysis" instead of "structured")
  try {
    const parsed = JSON.parse(responseString);
    if (parsed && typeof parsed === 'object') {
      // Check if AI used wrong root key
      if (parsed.analysis || parsed.response || parsed.message) {
        console.warn('⚠️ AI used wrong root key, attempting to transform...');
        // Log what we found
        console.warn('Found keys:', Object.keys(parsed));
      }
    }
  } catch (error) {
    // Ignore, will fail below
  }

  // Strategy 6: Last resort - return error state
  console.error('All parsing strategies failed for:', responseString.substring(0, 200));
  return null;
}

// Validate response structure
function isValidMentorResponse(obj: any): obj is RawMentorResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.structured) &&
    obj.structured.length > 0 &&
    obj.structured.every(
      (section: any) =>
        section.header && typeof section.header === 'string' && Array.isArray(section.body)
    )
  );
}

// Normalize response to ensure all text elements have IDs
function normalizeResponse(response: any): RawMentorResponse {
  const normalizeBodyItems = (items: any[]): MentorResponseBodyItem[] => {
    return items.map((item, index) => {
      const normalizedItem: MentorResponseBodyItem = {
        type: item.type,
      };

      // Handle content
      if (item.content) {
        // Ensure content is a string (AI sometimes returns objects)
        if (typeof item.content === 'string') {
          normalizedItem.content = item.content;
          normalizedItem.id = item.content.slice(0, 5);
        } else if (typeof item.content === 'object') {
          // Convert object content to string
          console.warn('⚠️ AI returned object as content, converting to string:', item.content);
          normalizedItem.content = JSON.stringify(item.content, null, 2);
          normalizedItem.id = `obj-${item.type}-${index}`;
        } else {
          // Convert other types to string
          normalizedItem.content = String(item.content);
          normalizedItem.id = `str-${item.type}-${index}`;
        }
      } else {
        // Generate a fallback ID for items without content
        normalizedItem.id = `item-${item.type}-${index}`;
      }

      // Handle items array
      if (item.items) {
        if (item.type === 'list') {
          // Convert list items to string array
          normalizedItem.items = item.items.map((listItem: any, index: number) => {
            let text: string;
            if (typeof listItem === 'string') {
              text = listItem;
            } else if (listItem.text) {
              text = listItem.text;
            } else {
              text = String(listItem);
            }

            return {
              text,
              id: text.slice(0, 10) + index,
            };
          });
        } else if (item.type === 'plan') {
          // Convert plan items to MentorResponsePlanItem array
          normalizedItem.items = item.items.map((planItem: any, index: number) => {
            const normalizedPlan: any = {
              title: planItem.title,
              details: [],
            };

            if (planItem.details) {
              normalizedPlan.details = planItem.details.map((detail: any, detailIndex: number) => {
                let text: string;
                if (typeof detail === 'string') {
                  text = detail;
                } else if (detail.text) {
                  text = detail.text;
                } else {
                  text = String(detail);
                }

                return {
                  text,
                  id: text.slice(0, 10) + detailIndex,
                };
              });
            }

            return normalizedPlan;
          });
        }
      }

      return normalizedItem;
    });
  };

  const normalizedSections: MentorResponseSection[] = response.structured.map((section: any) => ({
    header: section.header,
    summary: section.summary,
    body: normalizeBodyItems(section.body || []),
  }));

  return {
    structured: normalizedSections,
  };
}

// Clean common JSON formatting issues
function cleanJsonString(str: string): string {
  return str
    .trim()
    .replace(/^```json\s*/, '') // Remove markdown code blocks
    .replace(/\s*```$/, '')
    .replace(/^\s*`/, '') // Remove single backticks
    .replace(/`\s*$/, '')
    .replace(/\\"/g, '"') // Fix escaped quotes
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

// Extract JSON from mixed content (e.g., if API returns explanation + JSON)
function extractJsonFromString(str: string): string | null {
  // Look for JSON object pattern
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

// Fix truncated JSON by closing open brackets and braces
function fixTruncatedJson(str: string): string | null {
  // Remove markdown code blocks first
  let cleaned = str.replace(/^```json\s*/, '').replace(/\s*```$/, '');

  // Count open brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
  }

  // Close any open structures
  let fixed = cleaned;

  // Close brackets first (inner structures)
  for (let i = 0; i < openBrackets; i++) {
    fixed += ']';
  }

  // Then close braces (outer structures)
  for (let i = 0; i < openBraces; i++) {
    fixed += '}';
  }

  // Additional safety: if we end with a comma, remove it
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');

  // If we have a reasonable amount of content and it looks like JSON, try to parse it
  if (fixed.length > 20 && fixed.includes('"structured"') && fixed.startsWith('{')) {
    return fixed;
  }

  return null;
}

