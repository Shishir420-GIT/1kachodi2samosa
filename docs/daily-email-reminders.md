# Daily email reminders

## Product shape

Make reminders an explicit, optional return loop for signed-in users. After a user saves a takeaway, offer: “Send me one small practice reminder each day.” They choose a local time and timezone. The email contains one short reviewed prompt, a link to practise, and a one-click unsubscribe link.

The first release should send no more than one message per local day. It should not include the user's raw practice text, sensitive scenario descriptions, streak pressure, guilt language, or a public score. A missed day does not reset progress.

Example subject: `One sentence to practise today`

Example body:

> Today’s moment: a friend dismisses a boundary as “not a big deal.”
>
> Try one sentence: “It matters because they already said no. Let’s leave it there.”
>
> Practise another response → [site]

Include the sender identity, why the recipient is receiving the message, preference link, and one-click unsubscribe in every email.

## Delivery architecture

Use the backend Vercel project (Supabase and a transactional email provider such as Resend):

1. The signed-in browser writes the user's opt-in, local delivery time, timezone and consent timestamp to `reminder_preferences`. Row Level Security keeps this user-owned.
2. `POST /cron/reminders` on the backend runs `backend.reminders.run(send=True)`. It is authorized by `Authorization: Bearer $CRON_SECRET`, not Google IAM — there is no Cloud Run Job anymore. `vercel.json` declares a daily Vercel Cron trigger; see the README's "Daily reminders" section for why an external scheduler is also recommended on the Hobby plan to approximate the old 15-minute cadence.
3. The handler uses the server-only Supabase secret key to find enabled users whose chosen local time is due and who have not received a message for that local date.
4. It gets the recipient address from Supabase Auth on the server, selects a reviewed reminder, and sends it through the email provider.
5. After a successful provider response, it updates `last_sent_at`. Use an idempotency key based on user ID plus local date so retries do not send duplicates.
6. The unsubscribe link carries an expiry and an HMAC signature. It disables reminders without requiring login. Never put a Supabase secret or provider key in the link.

Whatever triggers `/cron/reminders` — Vercel Cron or an external scheduler — its timing is approximate; the product should promise a delivery window such as “around 9 AM,” not an exact minute. Store IANA timezone names such as `Asia/Kolkata`, not numeric UTC offsets, so daylight-saving changes remain correct internationally.

## Required configuration

Supabase:

- `SUPABASE_URL`: Project Settings → Data API → Project URL. This is public client configuration.
- `SUPABASE_PUBLISHABLE_KEY`: Project Settings → API Keys → publishable key. This is public client configuration and is used by the browser with RLS.
- `SUPABASE_SECRET_KEY`: Project Settings → API Keys → secret key. Server-only; required for `/cron/reminders` to read Auth email addresses. Set it only on the backend Vercel project's environment variables. Never paste it into source control or expose it through `/api/config`.
- Auth configuration: enable Google login, set the frontend's Vercel URL as Site URL, and allow `https://YOUR_FRONTEND_URL/auth` as a redirect URL.

Email provider:

- `RESEND_API_KEY`: server-only API key from Resend, set on the backend Vercel project.
- `REMINDER_FROM_EMAIL`: sender on a domain verified with the provider, for example `practice@1kachodi2samosa.in`.
- DNS verification records supplied by the provider (SPF/DKIM). These are DNS records, not environment variables.

Application:

- `PUBLIC_SITE_URL`: the frontend's public HTTPS origin.
- `UNSUBSCRIBE_SIGNING_SECRET`: at least 32 random bytes, set on the backend Vercel project.
- `CRON_SECRET`: at least 32 random bytes. Vercel sends it automatically as `Authorization: Bearer $CRON_SECRET` for the declared cron trigger; use the same value in whatever external scheduler you add for finer-grained cadence.

## Before enabling email

- Test opt-in, pause, unsubscribe and deletion with two accounts.
- Verify one user cannot read or modify another user's preferences.
- Verify retries do not duplicate a daily email.
- Confirm the provider's signed-out email link works and the sending domain passes SPF/DKIM checks.
- Send only to explicitly opted-in test addresses until the live content and unsubscribe flow have been reviewed.

The dashboard writes opt-in, local time, timezone and consent state to Supabase. `backend/reminders.py` implements timezone-aware due selection, one-message-per-local-day checks, Resend idempotency keys and signed unsubscribe links. Resend authentication has been verified locally. Actual sending remains disabled until the sender domain is verified and `/cron/reminders` is being triggered on a schedule; the dashboard says this plainly rather than promising delivery prematurely.

Local dry run after the agentic migration:

```bash
PYTHONPATH=. .venv/bin/python -m backend.send_reminders
```

Add `--send` only after the sender domain is verified and the opted-in recipient addresses are test accounts.
