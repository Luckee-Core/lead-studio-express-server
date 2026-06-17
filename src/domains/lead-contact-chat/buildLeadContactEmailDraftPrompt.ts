import type { Lead } from '../../data/leads/get-all';
import {
  getMandatoryOpeningLineFromPersona,
  getMandatorySignOffLineFromPersona,
} from './emailDraftPersonaStructure';

const EMAIL_PERSONA_FIELD_LABELS: Record<string, string> = {
  voice: 'Voice',
  tone: 'Tone',
  audience: 'Audience',
  serviceOffering: 'Service / offer (what you sell or help with)',
  leansTowards: 'Leans towards',
  avoids: 'Avoids',
  hookStyles: 'Hook styles',
  formattingPreferences: 'Formatting preferences',
  emojiUsage: 'Emoji usage',
  rhetoricalStrategies: 'Rhetorical strategies',
  hashtagUsage: 'Hashtag usage',
  ctaStrategies: 'CTA strategies',
  dos: 'Do',
  donts: "Don'ts",
  signOff: 'Email sign-off',
};

const formatLeadResearchContext = (lead: Lead): string => {
  const parts: string[] = [];
  if (lead.description?.trim()) {
    parts.push(`Short description (leads.description):\n${lead.description.trim()}`);
  }
  const summary = lead.summary;
  if (summary && typeof summary === 'object' && !Array.isArray(summary)) {
    const s = summary as Record<string, unknown>;
    const content = s.content;
    if (typeof content === 'string' && content.trim()) {
      parts.push(`Research narrative (summary.content):\n${content.trim()}`);
    }
    const highlights = s.highlights;
    if (Array.isArray(highlights) && highlights.length > 0) {
      parts.push(
        `Highlights:\n${highlights.map((h) => `- ${String(h)}`).join('\n')}`,
      );
    }
    const facts = s.facts;
    if (facts && typeof facts === 'object') {
      parts.push(`Structured facts (JSON):\n${JSON.stringify(facts, null, 2)}`);
    }
  }
  return parts.length > 0 ? parts.join('\n\n') : '(No description or summary on file.)';
};

export type ColdEmailOfferingPromptLine = {
  title: string;
  hook: string;
  description: string;
};

/** @deprecated Use ColdEmailOfferingPromptLine */
export type OfferedServicePromptLine = ColdEmailOfferingPromptLine;

const formatColdEmailOfferingCatalog = (offerings: ColdEmailOfferingPromptLine[]): string => {
  if (offerings.length === 0) {
    return '(No cold email offerings yet. Do not invent specific offerings; keep any help line generic or minimal.)';
  }
  return offerings
    .map((s, i) => {
      const hook = s.hook.trim() ? `\n  Hook: ${s.hook.trim()}` : '';
      const desc = s.description.trim() ? `\n  ${s.description.trim()}` : '';
      return `${i + 1}. **${s.title}**${hook}${desc}`;
    })
    .join('\n\n');
};

const formatServicesStudioCatalog = formatColdEmailOfferingCatalog;

/** True if any offering title/description signals AI, software, automation, or training (for draft breadth rules). */
const catalogHasAiSoftwareTrainingDimension = (offerings: ColdEmailOfferingPromptLine[]): boolean => {
  const re =
    /\bAI\b|artificial intelligence|SaaS|saas|software|automation|workshop|workshops|\btraining\b/i;
  for (const s of offerings) {
    if (re.test(`${s.title}\n${s.hook}\n${s.description}`)) {
      return true;
    }
  }
  return false;
};

/**
 * When the catalog includes AI/software/training, require the model to reflect that in the body (not only lead-gen lines).
 */
const formatCatalogBreadthBlock = (offerings: ColdEmailOfferingPromptLine[]): string => {
  if (!catalogHasAiSoftwareTrainingDimension(offerings)) {
    return '';
  }
  return `

## Required catalog breadth (mandatory when this section appears)
At least one numbered service above mentions **AI, software/SaaS, automation, workshops, or training**. The **body** must include **one short clause** grounded in that (e.g. custom AI tools, automation, software for how they run the business, workshops for the team). Do **not** describe what you help with as **only** contact lists, lead-gen websites, or generic social or digital marketing while **omitting** AI/software/training entirely, unless **Email persona: Avoids** or **Don'ts** explicitly forbids mentioning AI.

`;
};

/**
 * When Email persona includes a sign-off line, require it as the final line of the JSON body.
 */
const formatMandatorySignOffBlock = (persona: Record<string, string>): string => {
  const line = getMandatorySignOffLineFromPersona(persona);
  if (!line) {
    return '';
  }
  return `

## MANDATORY SIGN-OFF (non-negotiable)
After the last paragraph of the message, use **one blank line** (double newline), then end **body** with **exactly** this as the **final** line (copy character-for-character):
${line}

**Rules:**
- Do **not** add "Thanks", "Best", "Cheers", "Let me know", "Talk soon", or any other line after this sign-off.
- Do **not** substitute a different name or sign-off.

`;
};

const formatEmailPersona = (persona: Record<string, string>): string => {
  const lines: string[] = [];
  for (const [key, label] of Object.entries(EMAIL_PERSONA_FIELD_LABELS)) {
    const v = persona[key]?.trim();
    if (v) {
      lines.push(`${label}: ${v}`);
    }
  }
  if (lines.length === 0) {
    return '(No email persona fields provided. Use a direct, concise outbound style.)';
  }
  return lines.join('\n');
};

const formatMandatoryOpeningBlock = (line: string | null): string => {
  if (!line) {
    return '';
  }
  return `

## MANDATORY OPENING (non-negotiable; overrides all other greeting guidance)
The JSON **body** must **begin with exactly this as the first line** (copy character-for-character, including punctuation):
${line}

**Rules:**
- Put **nothing** before that line: no "Hey", "Hi", "Hello", "Hey there", "Reaching out", no dash, no preamble.
- After that line, use **one blank line** (double newline), then the rest of the body.
- Do **not** paraphrase or substitute a synonym for this opening.

`;
};

/**
 * System prompt for lead-contact email draft. Intentionally short; context and a checklist live in the user message.
 */
export const buildLeadContactEmailDraftSystemPrompt = (): string => {
  return `You return **only** valid JSON (no markdown): {"subject":"one line","body":"plain text, no HTML"}.

Write in **first person** to the contact. Never write as if you are their business.

## Zero-tolerance output (instant fail if violated)
- **Never** mention their **booking calendar**, **online booking**, **scheduling widget**, **slots**, **availability**, **calling in to schedule**, **calendar isn't live**, or **guess at availability** unless that **exact** situation is written in **Short description** or **Research narrative** prose in the user message. If unsure, **omit** all booking/scheduling talk.
- **Never** write **"I was checking out your site"** / **y'alls site** + **any** problem (booking, calendar, social, friction, etc.) unless the **same** problem appears in that **prose**. Otherwise **do not** open a sentence that way at all.
- **Never** describe them as a **24/7** or **emergency** shop, or tie **friction** to **their** hours or dispatch model, unless that appears **verbatim** in **Short description** or **Research narrative**.
- **Never** close with **few questions**, **couple questions**, **ask a few questions**, or **see if there's a fit** (Q&A framing). Close with a **short call** only.
- **Never** use words like **bandwitdh** or **streamlining**
- **Never** say *money is tight*

## Precedence
1) User message **MANDATORY OPENING** / **MANDATORY SIGN-OFF**: copy **exactly**; body starts with that first line, then blank line; ends with blank line then sign-off; nothing after sign-off.
2) **Email persona** (Voice, Do, Don't, CTA, Hook styles): binding for tone, structure, fixed phrases.
3) **Cold email offerings catalog** in the user message defines **what you may claim**. If persona **Service / offer** conflicts with catalog **facts**, prefer **catalog**; still honor greeting and sign-off.

## Shape (hello + what you do, not a plan)
After mandatory opening + blank line: optional one neutral line (business name / on your radar) or **one** sentence only if **Short description** or **Research narrative** has a **concrete** fact in normal prose. Then **exactly one sentence** for what **you** do (catalog; one comma or "and" inside is OK). Include a **short** clause that **time and bandwidth are always tight** for owners in general (respect, not claiming *their* shop is slow or underwater). Then **one** close: **short call**, **minimal time**. **No** "we should", "let's fix", "here's what I'd suggest", "worth exploring" as homework for them. **No** "few/couple questions" or "see if there's a fit" interview framing. **No** second pitch sentence or bullet list in the body. About **2 to 4** short sentences after the opening block, **under ~85 words** with sign-off if present.

## Facts about them (strict)
Claims about **their** ops, site, social, booking stack, counties, 24/7, demand, or calendar: **only** from **Short description** or **Research narrative** as normal prose. **Do not** invent from **Structured facts JSON** or **Highlights** alone (includes: quiet social, booking calendar not live, site needs love, multi-county lists, slow calendar, "I was checking your site and noticed…" without a named issue from prose). If prose has nothing solid, skip observations.

Ban hedges about their shop: **I'm guessing**, **probably**, **I imagine**, **since you're** + invented ops. No flattery unless verbatim in prose.

## Hard bans
- No **—** or **–** (em/en dash); use comma, period, ASCII **-** only.
- No **Hey there** / **Hi there** / **Hello** / **Reaching out** as **body** first line when **MANDATORY OPENING** exists.
- Do not start **two** sentences in a row with **"I "**.
- No extra **Cheers** / **Thanks** / **Best** after the mandatory sign-off line when sign-off is required.

If the user message includes **Required catalog breadth**, put **one** clause (AI / software / automation / training) **inside** the single self-offer sentence. Respect persona voice (e.g. **y'all** when it fits).`;
};

/** Shared inputs for intro and follow-up user payloads (lead through coaching chat + persona). */
export type LeadContactEmailDraftContextParams = {
  lead: Lead;
  contactName: string;
  contactRole: string | null;
  contactEmail: string | null;
  chatTranscript: string;
  emailPersona: Record<string, string>;
  offeredServices: ColdEmailOfferingPromptLine[];
};

const INTRO_USER_MESSAGE_CHECKLIST = `**Checklist:** Follow the **system** rules (including **Zero-tolerance**). If **MANDATORY OPENING** / **MANDATORY SIGN-OFF** appear above, obey them exactly. **One** catalog sentence for what you do; if **Required catalog breadth** appears above, include AI/software/automation/training **in that sentence**. Facts about **them** only from **Short description** or **Research narrative** prose, not JSON/highlights. **Do not** mention booking calendars, online booking, scheduling, slots, or site checks unless that exact detail is in that prose. **Do not** say **24/7 emergency shop** or similar unless it's in that prose. No em/en dash. Do not start two sentences in a row with the word **I**. Close with a **short call**, not questions or fit-interview framing.`;

/**
 * User message sections from lead account through coaching chat (ends after transcript).
 * Used by intro payload and composed into the follow-up payload in the follow-up module.
 */
export const buildLeadContactEmailDraftUserPayloadLeadThroughChat = (
  params: LeadContactEmailDraftContextParams,
): string => {
  const {
    lead,
    contactName,
    contactRole,
    contactEmail,
    chatTranscript,
    emailPersona,
    offeredServices,
  } = params;
  const mandatoryOpening = getMandatoryOpeningLineFromPersona(emailPersona);

  return `## Lead (account)
Business name: ${lead.business_name}
Category: ${lead.category_name ?? '-'}
Website: ${lead.website ?? '-'}
${formatMandatoryOpeningBlock(mandatoryOpening)}
## Lead research / at a glance
${formatLeadResearchContext(lead)}

## Your cold email offerings catalog (use these offerings only; do not invent services beyond this list)
${formatColdEmailOfferingCatalog(offeredServices)}${formatCatalogBreadthBlock(offeredServices)}
## Recipient contact
Name: ${contactName}
Role: ${contactRole ?? '-'}
Email: ${contactEmail ?? '-'}

## Prior lead-contact coaching chat (user vs coach)
${chatTranscript}
`;
};

/**
 * Email persona + mandatory sign-off block for the user message.
 */
export const buildLeadContactEmailDraftUserPayloadPersonaSection = (
  emailPersona: Record<string, string>,
): string => {
  return `## Email persona (how the sender writes; voice and style)
${formatEmailPersona(emailPersona)}${formatMandatorySignOffBlock(emailPersona)}
`;
};

/**
 * Full user message for the **intro** draft only (first-touch checklist).
 */
export const buildLeadContactEmailDraftUserPayload = (
  params: LeadContactEmailDraftContextParams,
): string => {
  const prefix = buildLeadContactEmailDraftUserPayloadLeadThroughChat(params);
  const persona = buildLeadContactEmailDraftUserPayloadPersonaSection(params.emailPersona);
  return `${prefix}${persona}## Required output
Return JSON only: {"subject":"...","body":"..."}.

${INTRO_USER_MESSAGE_CHECKLIST}`;
};
