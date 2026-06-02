import type { LeadContact } from '../../data/lead-contacts/get-by-lead-id';

const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/**
 * True if any contact on the lead already matches the scraped email (case-insensitive) or phone (digits-only).
 */
export const findLeadContactDuplicateForReachOut = (
  contacts: LeadContact[],
  email: string | null,
  phone: string | null
): boolean => {
  const emailNorm = email?.trim().toLowerCase() ?? '';
  const phoneDigits = phone ? digitsOnly(phone) : '';

  for (const c of contacts) {
    if (emailNorm && c.email?.trim()) {
      if (c.email.trim().toLowerCase() === emailNorm) {
        return true;
      }
    }
    if (phoneDigits.length >= 7 && c.phone?.trim()) {
      const existingDigits = digitsOnly(c.phone);
      if (existingDigits.length >= 7 && existingDigits === phoneDigits) {
        return true;
      }
    }
  }

  return false;
};
