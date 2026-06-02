type BuildLeadContactChatUserPayloadParams = {
  contact: {
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    status: string;
  };
  lead: {
    businessName: string;
    summary: unknown | null;
    categoryName: string | null;
  };
  recentChat: { role: string; content: string }[];
  userMessage: string;
};

/**
 * System prompt for lead-contact outreach coach (JSON-only response).
 */
export const buildLeadContactChatSystemPrompt = (): string => {
  return `You are an expert B2B outreach coach helping the USER strategize about one lead contact.
You are NOT talking to the lead contact directly.
Return ONLY one JSON object:
{
  "content": "string"
}

Rules:
- By default, address the USER as "you" and refer to the lead contact in third person ("the contact", or their name from context).
- Do not roleplay as the user and do not roleplay as the lead contact unless the user explicitly asks for a drafted message.
- If the user asks for a draft message to send to the contact, clearly label it as a draft in the response body.
- Never invent facts, names, rankings, performance metrics, or company details that are not explicitly present in the provided context.
- If the user's message is only a greeting/small talk (e.g., "hey", "hi", "hello"), reply naturally and briefly like a normal conversation (1-2 sentences), then ask a simple clarifying question about what help they want.
- Give practical, direct coaching tailored to the specific contact and business context.
- Focus on how to deliver value in replies, follow-ups, and positioning.
- Keep response concise but useful (about 4-10 sentences).
- If context is incomplete, provide best next-step assumptions and what to ask next.
- Do not output markdown outside JSON.
- If the response spans multiple lines, keep it inside one JSON string: use \\n for line breaks inside "content", not raw newlines inside the quotes.`;
};

/**
 * Build structured user payload for the lead-contact chat coach.
 */
export const buildLeadContactChatUserPayload = (
  params: BuildLeadContactChatUserPayloadParams,
): string => {
  return `Conversation framing:
- The USER is chatting with you for coaching.
- The lead contact is a third-party person the USER wants to engage effectively.
- Unless explicitly asked to draft copy, respond as advisor guidance to the USER.

Lead contact context:\n${JSON.stringify(params.contact, null, 2)}\n\nBusiness context:\n${JSON.stringify(
    params.lead,
    null,
    2,
  )}\n\nRecent chat (oldest first):\n${JSON.stringify(
    params.recentChat,
    null,
    2,
  )}\n\nUser message:\n${params.userMessage}`;
};
