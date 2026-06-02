import { parseApiResponse, RawMentorResponse } from '../response-parser';

/**
 * Parse AI response text into structured JSON
 * 
 * Uses existing responseParser with multiple fallback strategies:
 * 1. Parse as direct JSON
 * 2. Extract JSON from markdown code blocks
 * 3. Extract JSON from text with prefixes/suffixes
 * 
 * @param responseText - Raw text from AI (should be JSON)
 * @returns Parsed structured response
 * @throws Error if all parsing strategies fail
 * 
 * @example
 * const response = parseStructuredJSON('{"structured":[{"header":"Test"}]}');
 * console.log(response.structured[0].header); // "Test"
 */
export const parseStructuredJSON = (responseText: string): RawMentorResponse => {
  console.log('🔍 Parsing structured JSON...');
  console.log('📄 Full AI response:', responseText.substring(0, 500));
  
  const parsed = parseApiResponse(responseText);
  
  if (!parsed) {
    console.error('❌ Failed to parse response. Full text:', responseText);
    throw new Error('Failed to parse AI response as structured JSON');
  }
  
  console.log(`✅ Parsed ${parsed.structured.length} section(s)`);
  
  return parsed;
};

