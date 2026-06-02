import type { LeadContact } from '../../data/lead-contacts/get-by-lead-id';

/**
 * True when at least one contact has both a non-empty email and phone (Facebook Apify can be skipped).
 */
export const hasAnyLeadContactWithEmailAndPhone = (contacts: LeadContact[]): boolean => {
  return contacts.some((c) => Boolean(c.email?.trim()) && Boolean(c.phone?.trim()));
};
