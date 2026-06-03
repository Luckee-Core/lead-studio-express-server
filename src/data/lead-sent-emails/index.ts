/**
 * Lead Sent Emails Data Access Layer
 */

export { getAllLeadSentEmails } from './get-all';
export type { LeadSentEmail } from './get-all';
export { createLeadSentEmailsRouter } from './router';
export { createLeadSentEmail } from './create';
export type { CreateLeadSentEmailInput } from './create';
export { findLeadSentEmailBySgMessageId } from './find-by-sg-message-id';
export { findLeadSentEmailByOpenTrackingToken } from './find-by-open-tracking-token';
export type { LeadSentEmailByOpenTokenRecord } from './find-by-open-tracking-token';
export { updateLeadSentEmailBySgMessageId } from './update-by-sg-message-id';
export { getRecentSentLeadEmailsWithPlainBodies } from './get-recent-with-plain-bodies';
export type { RecentSentEmailPlain } from './get-recent-with-plain-bodies';
export { plainBodiesFromSentEmailRows } from './plain-bodies-from-sent-rows';
export type { SentEmailPlainBody } from './plain-bodies-from-sent-rows';
export { listSentEmailsWithPlainBodiesForLeadContact } from './list-plain-bodies-for-lead-contact';
export { countLeadSentEmailsForContact } from './count-lead-sent-emails-for-contact';
