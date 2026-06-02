/**
 * Parse and validate AI response against unified JSON format
 */
export const parseAIResponse = (responseText: string): any => {
  try {
    const parsed = JSON.parse(responseText);

    // Validate structure
    if (!parsed.structured || !Array.isArray(parsed.structured)) {
      throw new Error('Response must have "structured" array');
    }

    // Validate each section
    for (const section of parsed.structured) {
      if (!section.header) {
        throw new Error('Each section must have a "header"');
      }
      if (!section.body || !Array.isArray(section.body)) {
        throw new Error('Each section must have a "body" array');
      }

      // Validate body items
      for (const item of section.body) {
        if (!item.id || !item.type) {
          throw new Error('Each body item must have "id" and "type"');
        }

        const validTypes = ['paragraph', 'list', 'subheader', 'plan'];
        if (!validTypes.includes(item.type)) {
          throw new Error(`Invalid type "${item.type}". Must be one of: ${validTypes.join(', ')}`);
        }
      }
    }

    return parsed;
  } catch (error: any) {
    console.error('Failed to parse AI response:', error.message);
    console.error('Response text:', responseText);

    // Return a fallback response
    return {
      structured: [
        {
          header: 'Response',
          body: [
            {
              id: 'error-1',
              type: 'paragraph',
              content: 'I apologize, but I encountered an error generating a properly formatted response. Please try again.',
            },
          ],
        },
      ],
    };
  }
};
