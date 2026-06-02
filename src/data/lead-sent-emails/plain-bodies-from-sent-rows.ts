/**
 * Shared join: lead_sent_emails rows → subject + plain-text body from lead_contact_emails TipTap JSON.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { tiptapToPlainText } from '../lead-contact-emails/tiptap-to-plain-text';

export type SentEmailPlainBody = {
  sentAt: string;
  subject: string;
  bodyPlain: string;
};

type SentRow = {
  lead_email_id: string;
  sent_at: string;
};

/**
 * Loads `lead_contact_emails` for the given sent rows and returns plain subject/body lines.
 * Preserves input order (typically newest-first). Skips rows missing email row or empty subject+body.
 *
 * @param supabase - Supabase client (RLS applies).
 * @param sentRows - Rows with `lead_email_id` and `sent_at`.
 * @returns Ordered list of subject + plain body for each valid send.
 */
export const plainBodiesFromSentEmailRows = async (
  supabase: SupabaseClient,
  sentRows: SentRow[],
): Promise<SentEmailPlainBody[]> => {
  if (!sentRows.length) {
    return [];
  }

  const ids = [...new Set(sentRows.map((r) => r.lead_email_id).filter(Boolean))] as string[];
  if (ids.length === 0) {
    return [];
  }

  const { data: emailRows, error: emailErr } = await supabase
    .from('lead_contact_emails')
    .select('id, subject, body')
    .in('id', ids);

  if (emailErr) {
    throw new Error(`Failed to fetch lead contact emails: ${emailErr.message}`);
  }

  const byId = new Map((emailRows ?? []).map((e) => [e.id as string, e]));

  const out: SentEmailPlainBody[] = [];
  for (const row of sentRows) {
    const e = byId.get(row.lead_email_id);
    if (!e) continue;
    const subject = typeof e.subject === 'string' ? e.subject.trim() : '';
    const bodyPlain = e.body ? tiptapToPlainText(e.body as Record<string, unknown>) : '';
    if (!subject && !bodyPlain) continue;
    out.push({
      sentAt: row.sent_at,
      subject,
      bodyPlain,
    });
  }

  return out;
};
