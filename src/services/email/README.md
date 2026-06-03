# Email service (Gmail API)

Outbound email is sent via **Gmail API** using a Google Cloud service account with **domain-wide delegation** (Google Workspace). SendGrid has been removed.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GMAIL_SERVICE_ACCOUNT_JSON_PATH` | One of these | Path to the downloaded service account `.json` file (recommended for local dev). |
| `GMAIL_SERVICE_ACCOUNT_JSON` | One of these | Full JSON string of the service account key (minified one line). |
| `GMAIL_SERVICE_ACCOUNT_JSON_BASE64` | One of these | Base64-encoded JSON (recommended on Railway). Do **not** set this if you only have a plain JSON file. |
| `GMAIL_SEND_AS_EMAIL` | Yes* | Default Workspace mailbox when a draft has no **From identity** (`lead_contact_emails.email_sending_identity_id` is null). Still required for Gmail push/watch unless you only use identities. |
| Per-identity vars | When using `email_sending_identities` | Migration `145_email_sending_identities.sql` seeds two rows whose `send_as_env_key` values must be set on the server, e.g. `GMAIL_SEND_AS_TROUT_HOUSE` and `GMAIL_SEND_AS_PHILLY_AI`, each to the Workspace address to impersonate. Same service account must be allowed to impersonate every address you configure. |

Optional (fallbacks for from address / name):

- `SENDGRID_FROM_EMAIL` – fallback default from address if `GMAIL_SEND_AS_EMAIL` is not set.
- `SENDGRID_FROM_NAME` – default “From” display name for test emails.

## Google Workspace setup

1. Create a service account in Google Cloud Console (APIs & Services → Credentials).
2. Enable the **Gmail API** for the project.
3. Create a key (JSON) for the service account and set `GMAIL_SERVICE_ACCOUNT_JSON_BASE64` or `GMAIL_SERVICE_ACCOUNT_JSON` (never commit the key; use env vars on the host).
4. In Google Admin (admin.google.com): **Security → Access and data control → API controls → Domain-wide delegation**. Add the service account’s **Client ID** and grant scopes:  
   - `https://www.googleapis.com/auth/gmail.send` (required for sending)  
   - `https://www.googleapis.com/auth/gmail.readonly` (required for Gmail push / reply detection)
5. Set `GMAIL_SEND_AS_EMAIL` to the default Workspace user for sends that do not pick a row from `email_sending_identities`.
6. For multiple **From** mailboxes in the CRM UI, run migration `145_email_sending_identities.sql` (or equivalent) and set each seeded `send_as_env_key` in your host environment to the real Workspace address.

## Message ID and webhooks

- `sendLeadEmail` returns the **Gmail message ID** (numeric string). It is stored in `lead_sent_emails.sg_message_id`.
- **Gmail Pub/Sub push** (`POST /api/webhooks/gmail-push`): receives mailbox change notifications. The handler fetches `history.list`, detects when a new message in INBOX is a reply to a tracked sent message (same thread as a `lead_sent_emails.sg_message_id`), and sets the related `lead_contact` status to `responded`.
- **Watch renewal**: Gmail watch expires after 7 days. Call `POST /api/cron/renew-gmail-watch` at least once per week (e.g. daily via Railway cron or external scheduler). The first call starts the watch and stores the initial `historyId` in `gmail_watch_state`.

## Gmail push setup (optional)

1. **Supabase**: Run `sql/gmail_watch_state.sql` in the SQL editor to create the `gmail_watch_state` table.
2. **GCP**: Create a Pub/Sub topic, grant `gmail-api-push@system.gserviceaccount.com` publish rights, create a **push** subscription with endpoint `https://your-app/api/webhooks/gmail-push`.
3. **Workspace**: Add scope `https://www.googleapis.com/auth/gmail.readonly` to the service account’s domain-wide delegation (in addition to `gmail.send`).
4. **Env**: Optional `GMAIL_PUBSUB_TOPIC` (default `projects/tht-web-e2134/topics/gmail-push`).
5. Call `POST /api/cron/renew-gmail-watch` once to start the watch, then schedule it daily.

- The **SendGrid webhook** (`POST /api/webhooks/webhook`) can still update `opened_at` for legacy SendGrid sends. **Gmail API sends do not use SendGrid** — open tracking for those uses the pixel below.

## Open tracking pixel (Gmail sends)

1. Run `sql/lead_sent_emails_open_tracking_token.sql` in Supabase (adds `open_tracking_token` + unique index).
2. Set `EMAIL_OPEN_TRACKING_BASE_URL` to this server’s **public HTTPS** URL (e.g. Railway URL or an ngrok tunnel in dev). Must be reachable by the recipient’s mail client — not `http://localhost` unless you tunnel.
3. On each send (send-now, queue, bulk, legacy `/send`), when the base URL is set, express generates a token, stores it on `lead_sent_emails`, and appends a 1×1 `<img>` to the HTML part of the MIME message.
4. When the email is opened, the client requests `GET {baseUrl}/api/email/open?t=<token>`. The handler updates `opened_at`, `opened_count`, and `delivery_status: opened` (unless bounced), and on the **first** open inserts a `lead_contact_opened` activity.
5. Response: transparent **GIF** by default. Set `EMAIL_OPEN_TRACKING_REDIRECT_URL` to return a 302 redirect instead (e.g. a logo URL).

Verify:

```bash
# After sending a lead email with tracking enabled, copy token from DB or HTML source
curl -sI "https://your-host/api/email/open?t=TOKEN"
```
