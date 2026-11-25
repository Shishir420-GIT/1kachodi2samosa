# Dear Men — practise the words, then show up

An English-only agentic learning and accountability application built on the existing 1kachodi2samosa.in campaign. React Router preserves the original design across dedicated guide, reality-check, practice, story, AI-transparency and account pages; Python FastAPI runs Google ADK 2.9.0; Supabase powers Google sign-in, private progress, reminder consent, accountability circles and a privacy-scrubbed story wall.

## Architecture

This is two independently deployed services sharing one repo:

- **`apps/web`** — the React Router SSR frontend. Its `/api/*` resource routes (`api.practice.ts`, `api.stories.ts`, `api.health.ts`, `api.unsubscribe.ts`) apply rate limiting, then forward to the backend.
- **`backend/`** (served through the root `api/index.py` + `vercel.json`) — the FastAPI app running Google ADK. It never faces the browser directly; only the frontend server calls it, authenticated with a shared secret.

They are two separate Vercel projects pointed at the same GitHub repo with different **Root Directories**, so each gets its own URL, environment variables and deploy history. The frontend calls the backend over `BACKEND_API_URL`, never over a shared loopback port — there is no persistent co-located process on Vercel, unlike the previous Cloud Run container.

## Run locally

Requires Node 24+, Python 3.12 and npm. From this directory:

```bash
npm ci
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # backend vars
cp apps/web/.env.example apps/web/.env   # frontend vars
```

Fill in both `.env` files (`BACKEND_SHARED_SECRET` must match in both; generate it with `openssl rand -hex 32`). Then, in two terminals:

```bash
# terminal 1 — backend, with the venv active
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --env-file .env --reload

# terminal 2 — frontend
npm run dev --prefix apps/web
```

Open http://localhost:3000. The default `AI_MODE=demo` is an explicitly labelled scripted preview and does not call Gemini. The health endpoint is `/api/health`.

## Deploy to Vercel

Two Vercel projects, same repo, different Root Directories. Hobby plan works; see the cron note in step 4 for what Hobby changes about reminder delivery.

### 1. Backend project

- New Vercel project → import this repo → **Root Directory: `.`** (the repo root, not `backend/`).
- Framework preset: **Other**. No build command is needed; Vercel's Python runtime picks up `api/index.py` and installs from the root `requirements.txt` automatically.
- Environment variables (see `.env.example`): `AI_MODE`, `GEMINI_MODEL`, `DAILY_MODEL_CALL_LIMIT`, `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `BACKEND_SHARED_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`, `PUBLIC_SITE_URL`, `UNSUBSCRIBE_SIGNING_SECRET`.
- Deploy. Note the resulting URL, e.g. `https://dear-men-api.vercel.app`.

### 2. Frontend project

- New Vercel project → import the same repo → **Root Directory: `apps/web`**.
- Framework preset: Vercel auto-detects React Router (via `@react-router/dev`).
- Environment variables (see `apps/web/.env.example`): `AI_MODE`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `BACKEND_API_URL` (the backend project's URL from step 1), `BACKEND_SHARED_SECRET` (same value as the backend project).
- Deploy. Note this URL too, e.g. `https://dear-men.vercel.app` — this is the one you share.

The Supabase project must already have both migrations applied: `supabase/schema.sql` and `supabase/agentic_mvp.sql`.

### 3. Configure Google sign-in through Supabase

In Supabase Authentication → URL Configuration:

- Set **Site URL** to the frontend's Vercel URL.
- Add `https://YOUR_FRONTEND_URL/auth**` to Redirect URLs.
- Keep `http://127.0.0.1:3000/auth**` in Redirect URLs while testing locally.

Then enable **Google** in Supabase Authentication → Sign In / Providers, using an OAuth client whose **Authorized redirect URI** is the Supabase callback (`https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`), and whose **Authorized JavaScript origins** include the frontend's Vercel URL. Copy the Google Client ID and Client Secret into Supabase; no Google secret belongs in this repo or either `.env`.

Open `/auth` in a private browser, test **Continue as guest**, then **Continue with Google**.

### 4. Daily reminders

`POST /cron/reminders` on the backend project (protected by `Authorization: Bearer $CRON_SECRET`) replaces the old Cloud Run Job + Cloud Scheduler pair. `vercel.json` declares a daily cron at `03:00 UTC`.

**On the Hobby plan, Vercel silently reduces any cron to once a day**, so this one invocation only reaches users whose preferred local reminder time falls in the few minutes after 03:00 UTC — not everyone's own chosen time. To restore true per-user local-time delivery (checking every ~15 minutes, matching the original design), point a free external scheduler — [cron-job.org](https://cron-job.org) or a scheduled GitHub Actions workflow — at `https://YOUR_BACKEND_URL/cron/reminders` with header `Authorization: Bearer $CRON_SECRET` on that cadence. The endpoint itself doesn't care who calls it, only that the secret matches. On Vercel Pro, you can instead tighten `vercel.json`'s cron schedule to `*/15 * * * *` and drop the external scheduler.

### 5. Verify the live deployment

```bash
curl https://YOUR_BACKEND_URL/health
```

The response must say `ai_mode: live`; `ai_provider_status` becomes `verified` after a successful model call. Complete a practice on the frontend and expand "How this response was made"; it must list `ADK coach` and `ADK practice partner`, not a scripted fallback. Open `/ai` to inspect provider status and agent boundaries. Submit a deliberately fictional story containing fake identifiers, confirm the response reports the privacy workflow, and confirm only sanitized text enters the Supabase `pending` queue.

Gemini free-tier content may be used by Google to improve its products. Use fictional/anonymized demo material; move sensitive production traffic to a provider tier with appropriate data terms.

## Verification

```bash
npm run typecheck --prefix apps/web
npm run build --prefix apps/web
pip install -r requirements.txt pytest httpx
PYTHONPATH=. python -m pytest backend/test_main.py -q
```

`docs/evaluation-cases.json` contains a live evaluation checklist. Automated tests use mocked generation for orchestration; they do not prove model safety or output quality. Record actual live results before claiming success. The initial guidance contains project-authored principles and a short bystander reference, not a professionally reviewed curriculum.

## Architecture and limits

- The frontend and backend are independent serverless deployments; there is no shared process or loopback port. Every call between them carries `BACKEND_SHARED_SECRET` so the backend's public URL can't be hit directly to bypass the frontend's rate limits.
- ADK coach generates schema-validated feedback. A separate ADK practice partner supplies one fictional reply. Story submissions first pass deterministic contact removal, then an ADK privacy guard removes contextual identifiers and moderates unsafe content. A second deterministic scrub runs before a separate insight writer receives only sanitized text. AI never publishes a story; accepted submissions remain pending for human review.
- Two practice attempts per UI flow; request size, history and generation time are bounded server-side. Requests are stateless.
- Each agent is bounded to one model call and 700 output tokens, and the backend process stops after `DAILY_MODEL_CALL_LIMIT` model calls per day. That counter lives in-process; on serverless, each cold start gets its own counter, so it reduces exposure but is not a hard spend cap. Use the Gemini Developer API free tier and watch usage in the Google AI Studio dashboard if zero model charges are required.
- The in-memory rate limiter in `apps/web/src/lib/rate-limit.server.ts` is per-instance. Serverless platforms can run multiple instances concurrently, so this bounds abuse from any one instance but is not a global budget — the code already documents this; it was equally true (if less likely) on single-instance Cloud Run.
- English only. No voice, clinical advice, emergency dispatch or measured real-world impact claims. Milestones measure completed practice actions, not morality.

See `docs/submission.md` for deployment/submission blockers and the deadline checklist.

The daily-return email design and operational notes are in `docs/daily-email-reminders.md`. The preference UI, delivery worker and unsubscribe flow are implemented; see "Daily reminders" above for the Vercel Cron setup.
