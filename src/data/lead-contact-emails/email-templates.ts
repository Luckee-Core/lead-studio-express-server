/**
 * Email template variations for lead contact emails.
 * Subject is the hook; body always starts with "Hola hola," then "My name is Matt Ruiz...".
 */

export type EmailTemplate = {
  variationId: number;
  subject: string;
  body: string;
};

const BODY_1 = `Hola hola,

My name is Matt Ruiz and I help local Philly teams save 1-2 hours per week with AI. Even at $40/hr, that's $2,080-$4,160 per year saved. That's $2k+ back to your team.

The process is simple:

**Week 1**
Meet with your team to find one pain point where AI can help.

**Weeks 2-4:**
Deliver an AI workflow that saves your team time right away.

**My questions for you**
1. How much would saving $2k+ per year mean for your team?
2. What more could you get done with 1-2 hours per week?

My process is efficient and cost effective. Would you be open to a quick 10m call to see if it's a match?

- Matt`;

const BODY_2 = `Hola hola,

My name is Matt Ruiz and I help local Philly teams save 1-2 hours per week with AI. Even at $40/hr, that's $2,080-$4,160 per year saved. That's $2k+ back to your team.

The process is simple:

**Week 1**
Meet with your team to find one pain point where AI can help.

**Weeks 2-4:**
Deliver an AI workflow that saves your team time right away.

**My questions for you**
1. How much would saving $2k+ per year mean for your team?
2. What more could you get done with 1-2 hours per week?

My process is efficient and cost effective. Would you be open to a quick 10m call to see if it's a match?

- Matt`;

const BODY_3 = BODY_1;
const BODY_5 = BODY_1;

const BODY_4 = `Hola hola,

My name is Matt Ruiz and I help local Philly teams save 1-2 hours per week with AI. Even at $40/hr, that's $2,080-$4,160 per year saved. That's $2k+ back to your team.

Here's how it works:

**Week 1**
Meet with your team to find one pain point where AI can help.

**Weeks 2-4:**
Deliver an AI workflow that saves your team time right away.

**My questions for you**
1. How much would saving $2k+ per year mean for your team?
2. What more could you get done with 1-2 hours per week?

My process is efficient and cost effective. Would you be open to a quick 10m call to see if it's a match?

- Matt`;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  { variationId: 1, subject: 'Save your team 1-2 hours per week', body: BODY_1 },
  { variationId: 2, subject: 'Getting you an extra 2 hours per week', body: BODY_2 },
  { variationId: 3, subject: 'AI is great for repetitive work', body: BODY_3 },
  { variationId: 4, subject: 'Save your team time', body: BODY_4 },
  { variationId: 5, subject: 'Saving 50+ hours per year', body: BODY_5 },
];

export const pickRandomTemplate = (): EmailTemplate => {
  const i = Math.floor(Math.random() * EMAIL_TEMPLATES.length);
  return EMAIL_TEMPLATES[i];
};
