# Lead Studio SQL (Supabase)

Run these scripts in the Supabase **SQL Editor** on a **new** project (empty `public` schema). Order matters.

## Required (core CRM + research)

| Order | File | Purpose |
|-------|------|---------|
| 1 | [`001_users_and_credits.sql`](001_users_and_credits.sql) | `users`, `user_credits`, `credit_deductions` |
| 2 | [`migrations/034_create_leads_table.sql`](migrations/034_create_leads_table.sql) | `leads` |
| 3 | [`migrations/034b_create_lead_contacts_table.sql`](migrations/034b_create_lead_contacts_table.sql) | `lead_contacts` |
| 4 | [`migrations/035_google_maps_scrape_runs.sql`](migrations/035_google_maps_scrape_runs.sql) | Find leads (maps) |
| 5 | [`migrations/035_create_website_scrape_runs.sql`](migrations/035_create_website_scrape_runs.sql) | Website scrapes |
| 6 | [`002_missing_crm_email_tables.sql`](002_missing_crm_email_tables.sql) | Categories, email drafts, queue, sent log |
| 7 | [`migrations/054_create_lead_google_search_research.sql`](migrations/054_create_lead_google_search_research.sql) | Google search research |
| 8 | [`migrations/055_create_lead_website_research.sql`](migrations/055_create_lead_website_research.sql) | Website research ledger |
| 9 | [`migrations/056_create_lead_facebook_page_research.sql`](migrations/056_create_lead_facebook_page_research.sql) | Facebook page research |
| 10 | [`migrations/057_create_lead_facebook_posts_research.sql`](migrations/057_create_lead_facebook_posts_research.sql) | Facebook posts research |
| 11 | [`migrations/059_create_lead_google_search_ai_audit_tables.sql`](migrations/059_create_lead_google_search_ai_audit_tables.sql) | Google search AI audit |
| 12 | [`migrations/062_create_lead_website_ai_audit_tables.sql`](migrations/062_create_lead_website_ai_audit_tables.sql) | Website AI audit |
| 13 | [`migrations/095_create_lead_contact_chat_tables.sql`](migrations/095_create_lead_contact_chat_tables.sql) | Contact chat |
| 14 | [`migrations/096_create_lead_activity_tables.sql`](migrations/096_create_lead_activity_tables.sql) | Lead + contact activities |
| 15 | [`migrations/076_create_lead_contact_email_attachments.sql`](migrations/076_create_lead_contact_email_attachments.sql) | Email attachments |
| 16 | [`migrations/112_create_to_call_log.sql`](migrations/112_create_to_call_log.sql) | To-call log |
| 17 | [`migrations/114_create_lead_costs.sql`](migrations/114_create_lead_costs.sql) | Lead costs |
| 18 | [`migrations/117_create_facebook_google_search.sql`](migrations/117_create_facebook_google_search.sql) | Facebook Google search |
| 19 | [`migrations/120_commercial_lead_research_queue_per_lead.sql`](migrations/120_commercial_lead_research_queue_per_lead.sql) | Commercial research queue |
| 20 | [`migrations/124_create_lead_auto_categorize_batch_ai_tables.sql`](migrations/124_create_lead_auto_categorize_batch_ai_tables.sql) | Auto-categorize batch |
| 21 | [`migrations/125_create_lead_playwright_website_url_discovery.sql`](migrations/125_create_lead_playwright_website_url_discovery.sql) | Playwright URL discovery |
| 22 | [`migrations/128_create_lead_facebook_posts_ai_audit_tables.sql`](migrations/128_create_lead_facebook_posts_ai_audit_tables.sql) | Facebook posts AI audit |
| 23 | [`migrations/129_create_lead_contact_email_draft_ai_audit_tables.sql`](migrations/129_create_lead_contact_email_draft_ai_audit_tables.sql) | Email draft AI audit |
| 24 | [`migrations/132_create_saved_filters.sql`](migrations/132_create_saved_filters.sql) | Saved filters |
| 25 | [`migrations/145_email_sending_identities.sql`](migrations/145_email_sending_identities.sql) | Sending identities + column alters |

## Optional (extra features)

| File | When |
|------|------|
| [`migrations/106_create_lead_dictation_notes_ai_audit_tables.sql`](migrations/106_create_lead_dictation_notes_ai_audit_tables.sql) | Dictation notes research |
| [`migrations/108_create_lead_opportunity_dictation_ai_tables.sql`](migrations/108_create_lead_opportunity_dictation_ai_tables.sql) | Opportunity dictation |
| [`migrations/109_create_lead_opportunity_suggestions.sql`](migrations/109_create_lead_opportunity_suggestions.sql) | Opportunity suggestions |
| [`migrations/101_offered_service_and_services_studio_chat.sql`](migrations/101_offered_service_and_services_studio_chat.sql) | Offered services |
| [`migrations/113_add_in_call_log_statuses.sql`](migrations/113_add_in_call_log_statuses.sql) | Extra to-call statuses |
| [`lead_sent_emails_open_tracking_token.sql`](lead_sent_emails_open_tracking_token.sql) | Email open pixels |

## Minimal env after schema

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY=
```

Optional: `GOOGLE_MAPS_API_KEY`, Gmail vars (see `src/services/email/README.md`).

## Verify

```bash
curl http://localhost:3032/api/health
curl http://localhost:3032/api/data/leads
```

## Source

Files under `migrations/` are copied from [mentorai-server](https://github.com/trouthouse-tech/mentorai-server) `migrations/`. `001`, `002`, and this README are Lead Studio OSS–specific.
