import type { SentEmailPlainBody } from '../../data/lead-sent-emails/plain-bodies-from-sent-rows';
import {
  buildLeadContactEmailDraftUserPayloadLeadThroughChat,
  buildLeadContactEmailDraftUserPayloadPersonaSection,
  type LeadContactEmailDraftContextParams,
} from './buildLeadContactEmailDraftPrompt';

const FOLLOW_UP_USER_MESSAGE_CHECKLIST = `**Checklist:** Follow the **system** rules (including **This is a follow-up** and **Zero-tolerance**). If **MANDATORY OPENING** / **MANDATORY SIGN-OFF** appear above, obey them exactly. Treat **Prior outbound email(s)** as what they already saw; write a **new** message; no full cold intro redo. Include **one** catalog-grounded clause in the single value sentence when appropriate; if **Required catalog breadth** appears above, include AI/software/automation/training **in that sentence**. Facts about **them** only from **Short description** or **Research narrative** prose. No em/en dash. Do not start two sentences in a row with the word **I**. Close with a **short call**, not questions or fit-interview framing.`;

export type LeadContactFollowUpEmailDraftUserPayloadParams =
  LeadContactEmailDraftContextParams & {
    priorOutboundsBlock: string;
  };

/**
 * Full user message for the **follow-up** draft only (prior sends + follow-up checklist).
 */
export const buildLeadContactFollowUpEmailDraftUserPayload = (
  params: LeadContactFollowUpEmailDraftUserPayloadParams,
): string => {
  const { priorOutboundsBlock, ...context } = params;
  const prefix = buildLeadContactEmailDraftUserPayloadLeadThroughChat(context);
  const priorSection = `

## Prior outbound email(s) (already sent to this contact)
${priorOutboundsBlock}
`;
  const persona = buildLeadContactEmailDraftUserPayloadPersonaSection(context.emailPersona);
  return `${prefix}${priorSection}${persona}## Required output
Return JSON only: {"subject":"...","body":"..."}.

${FOLLOW_UP_USER_MESSAGE_CHECKLIST}`;
};

const MAX_PRIOR_EMAILS_IN_PROMPT = 3;
const MAX_BODY_CHARS_PER_PRIOR = 2500;

/**
 * Formats already-sent emails for the user message (newest first). Truncates long bodies.
 */
export const formatPriorOutboundsBlock = (
  plainBodies: SentEmailPlainBody[],
): string => {
  if (!plainBodies.length) {
    return '(Prior send text unavailable — write a concise follow-up using lead research and persona only.)';
  }

  const lines: string[] = [];
  const slice = plainBodies.slice(0, MAX_PRIOR_EMAILS_IN_PROMPT);

  slice.forEach((row, i) => {
    const label = i === 0 ? 'Most recent send' : `Prior send ${i + 1}`;
    let body = row.bodyPlain.trim();
    if (body.length > MAX_BODY_CHARS_PER_PRIOR) {
      body = `${body.slice(0, MAX_BODY_CHARS_PER_PRIOR)}…`;
    }
    lines.push(
      `### ${label} (${row.sentAt})\nSubject: ${row.subject || '(no subject)'}\n\n${body || '(empty body)'}`,
    );
  });

  return lines.join('\n\n---\n\n');
};

const followUpShapeForTemplateStep = (step: 1 | 2 | 3): string => {
  if (step === 1) {
    return `## Follow-up shape (first bump)
After mandatory opening + blank line: **one** short line that you are following up (no guilt). **One** new angle or value clause tied to the **Services Studio catalog** (not a repeat of the whole first email). **Do not** re-do the full cold intro or re-explain everything from scratch. Keep **about 2 to 4** short sentences after the opening block, **under ~90 words** before sign-off if present. Close with a **short call**, not a list of questions.`;
  }
  if (step === 2) {
    return `## Follow-up shape (second ping)
After mandatory opening + blank line: **very short** check-in; assume they are busy. **No** long recap of prior emails. At most **one** clause that adds something small from the catalog or coaching context if it fits naturally. **About 2 to 3** short sentences after the opening, **under ~70 words** before sign-off. Close with a **short call**.`;
  }
  return `## Follow-up shape (later touch)
After mandatory opening + blank line: polite, low-pressure **last note** tone. **Do not** stack multiple asks or repeat the full pitch. **One or two** short sentences after the opening, **under ~60 words** before sign-off. You may gracefully close the loop without sounding bitter. Still end with a **short call** option, not interrogation.`;
};

/**
 * System prompt for follow-up outbound drafts (multi-step: template step 1–3).
 */
export const buildLeadContactFollowUpEmailDraftSystemPrompt = (
  followUpTemplateStep: 1 | 2 | 3,
): string => {
  const shape = followUpShapeForTemplateStep(followUpTemplateStep);

  return `You return **only** valid JSON (no markdown): {"subject":"one line","body":"plain text, no HTML"}.

Write in **first person** to the contact. Never write as if you are their business.

## This is a follow-up
They have already received at least one outbound from you. The **Prior outbound email(s)** section in the user message is ground truth for what was sent (when available). **Do not** contradict it. **Do not** paste it verbatim; write a **new** message.

${shape}

## Zero-tolerance output (instant fail if violated)
- **Never** mention their **booking calendar**, **online booking**, **scheduling widget**, **slots**, **availability**, **calling in to schedule**, **calendar isn't live**, or **guess at availability** unless that **exact** situation is written in **Short description** or **Research narrative** prose in the user message. If unsure, **omit** all booking/scheduling talk.
- **Never** write **"I was checking out your site"** / **y'alls site** + **any** problem (booking, calendar, social, friction, etc.) unless the **same** problem appears in that **prose**. Otherwise **do not** open a sentence that way at all.
- **Never** describe them as a **24/7** or **emergency** shop, or tie **friction** to **their** hours or dispatch model, unless that appears **verbatim** in **Short description** or **Research narrative**.
- **Never** close with **few questions**, **couple questions**, **ask a few questions**, or **see if there's a fit** (Q&A framing). Close with a **short call** only.

## Precedence
1) User message **MANDATORY OPENING** / **MANDATORY SIGN-OFF**: copy **exactly**; body starts with that first line, then blank line; ends with blank line then sign-off; nothing after sign-off.
2) **Email persona** (Voice, Do, Don't, CTA, Hook styles): binding for tone, structure, fixed phrases.
3) **Services Studio catalog** defines **what you may claim**. If persona **Service / offer** conflicts with catalog **facts**, prefer **catalog**; still honor greeting and sign-off.

## Facts about them (strict)
Claims about **their** ops, site, social, booking stack, counties, 24/7, demand, or calendar: **only** from **Short description** or **Research narrative** as normal prose. **Do not** invent from **Structured facts JSON** or **Highlights** alone.

Ban hedges about their shop: **I'm guessing**, **probably**, **I imagine**, **since you're** + invented ops. No flattery unless verbatim in prose.

## Hard bans
- No **—** or **–** (em/en dash); use comma, period, ASCII **-** only.
- No **Hey there** / **Hi there** / **Hello** / **Reaching out** as **body** first line when **MANDATORY OPENING** exists.
- Do not start **two** sentences in a row with **"I "**.
- No extra **Cheers** / **Thanks** / **Best** after the mandatory sign-off line when sign-off is required.

If the user message includes **Required catalog breadth**, include **one** short clause (AI / software / automation / training) **inside** the single value/offer sentence you use — not as a second pitch paragraph. Respect persona voice (e.g. **y'all** when it fits).`;
};
