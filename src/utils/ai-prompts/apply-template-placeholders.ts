export type AiPromptTemplateContext = {
  userName: string;
  userEmail: string;
  tenantDisplayName: string;
};

/**
 * Replace {{user_name}}, {{user_email}}, and {{tenant}} in prompt text.
 */
export const applyAiPromptTemplatePlaceholders = (text: string, ctx: AiPromptTemplateContext): string => {
  return text
    .replaceAll('{{user_name}}', ctx.userName)
    .replaceAll('{{user_email}}', ctx.userEmail)
    .replaceAll('{{tenant}}', ctx.tenantDisplayName);
};
