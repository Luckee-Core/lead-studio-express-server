/**
 * Lead Contacts Data Access Layer
 * Barrel exports for lead contact CRUD
 */

export { getLeadContactsByLeadId } from './get-by-lead-id';
export { getLeadContactById } from './get-by-id';
export { getLeadContactsByIds } from './get-by-ids';
export { getAllLeadContacts } from './get-all';
export type { LeadContact } from './get-by-lead-id';
export { createLeadContact } from './create';
export type { CreateLeadContactInput } from './create';
export { updateLeadContact } from './update';
export type { UpdateLeadContactInput } from './update';
export { deleteLeadContact } from './delete';
export { createLeadContactsRouter } from './router';
