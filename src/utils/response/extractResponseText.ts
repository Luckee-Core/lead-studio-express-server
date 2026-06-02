/**
 * Extract plain text from structured AI response
 * 
 * Handles different response types:
 * - Strategic: response field
 * - Brainstorm: response field
 * - Conversational: direct string
 * 
 * @param response - AI response (string or object)
 * @returns Plain text response
 * 
 * @example
 * extractResponseText("Hello") // "Hello"
 * extractResponseText({ response: "Hello", insights: [...] }) // "Hello"
 */
export const extractResponseText = (response: any): string => {
  if (typeof response === 'string') {
    return response;
  }
  
  if (response && typeof response === 'object') {
    // Strategic/Brainstorm responses have 'response' field
    if ('response' in response && typeof response.response === 'string') {
      return response.response;
    }
    
    // Fallback: stringify object
    return JSON.stringify(response);
  }
  
  return '';
};

