/**
 * Leads Data Access Layer
 * Barrel exports for lead CRUD
 */

export { getAllLeads } from './get-all';
export type { Lead, GetAllLeadsParams } from './get-all';
export { getLeadById } from './get-by-id';
export { createLead } from './create';
export type { CreateLeadInput } from './create';
export { updateLead } from './update';
export type { UpdateLeadInput } from './update';
export { deleteLead } from './delete';
export { getFacebookResearchForLead } from './get-facebook-research-for-lead';
export type { FacebookResearchForLead } from './get-facebook-research-for-lead';
export { getAiExchangeCostRowsForLead } from './get-ai-exchange-cost-rows-for-lead';
export type { LeadAiExchangeCostRow } from './get-ai-exchange-cost-rows-for-lead';
export { identifyLeadIdsForResearchQueue } from './identify-lead-ids-for-research-queue';
export {
  getLeadLovableContextById,
  type LeadLovableContext,
} from './get-lead-lovable-context-by-id';
export { createLeadsRouter } from './router';
