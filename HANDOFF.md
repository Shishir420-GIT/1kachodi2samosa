# Dear Men handoff memory

Last updated: 25 November 2026.

## Current state

- Branch: `vercel-version`. Deployment target migrated from Google Cloud Run to **Vercel**, as two separate Vercel projects (same repo, different Root Directories — see `README.md`).
- Stack unchanged otherwise: React Router SSR (`apps/web`), FastAPI + Google ADK 2.9.0 (`backend/`), Supabase, Resend.
- The frontend's `/api/*` resource routes no longer call a co-located `http://127.0.0.1:8000` process. They call `BACKEND_API_URL` (via `apps/web/src/lib/backend.server.ts`), authenticated with `BACKEND_SHARED_SECRET` so the backend's now-public URL can't be hit directly to bypass the frontend's rate limiting.
- New `POST /cron/reminders` endpoint on the backend (protected by `Authorization: Bearer $CRON_SECRET`) replaces the Cloud Run Job + Cloud Scheduler pair. `vercel.json` declares a daily Vercel Cron trigger; the Hobby plan collapses any cron to once a day, so true per-user local-time delivery needs an external scheduler hitting the same endpoint — documented in the README and `docs/daily-email-reminders.md`.
- Removed: `Dockerfile`, `.dockerignore`, `.gcloudignore`, `scripts/deploy.sh`, `scripts/deploy-reminders.sh`, `scripts/start.py`, `scripts/artifact-cleanup-policy.json`, and the hackathon-day working notes (`docs/submission.md`, `docs/verification.md`, `docs/demo-video-script.md`, `submission/*.pptx`) — all superseded by this migration.
- 27 backend tests pass (23 pre-existing + 4 new for the shared-secret and cron-secret guards). Frontend `typecheck` and `build` pass. A live round trip through the full chain (Node dev server → backend secret check → ADK coach/practice-partner) was exercised locally; Gemini itself returned transient `503 UNAVAILABLE` ("high demand") during that session for every model tried, reproduced with a bare `google-genai` call outside this app — the plumbing is verified, confirming actual model output still depends on Gemini's live availability.

## Required Vercel environment variables

Backend project (Root Directory `.`): `AI_MODE`, `GEMINI_MODEL`, `DAILY_MODEL_CALL_LIMIT`, `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `BACKEND_SHARED_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`, `PUBLIC_SITE_URL`, `UNSUBSCRIBE_SIGNING_SECRET`.

Frontend project (Root Directory `apps/web`): `AI_MODE`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `BACKEND_API_URL`, `BACKEND_SHARED_SECRET`.

`BACKEND_SHARED_SECRET` must be identical in both projects. Generate secrets with `openssl rand -hex 32`.

## Smoothest next steps

1. Create the backend Vercel project first (Root Directory `.`), fill its env vars, deploy, copy its URL.
2. Create the frontend Vercel project (Root Directory `apps/web`), set `BACKEND_API_URL` to the backend's URL, fill the rest, deploy.
3. Point Supabase Auth Site URL / redirect allowlist at the frontend's URL; enable the Google provider.
4. `curl https://YOUR_BACKEND_URL/health` and confirm `ai_mode: live`; complete a practice on the frontend and confirm it reports `ADK coach` / `ADK practice partner`, not fallback — retry if Gemini returns a transient error.
5. Pick a reminder cadence per the README's "Daily reminders" section (Vercel Cron alone on Hobby, or Vercel Cron + an external scheduler for true per-user timing).
6. Add a small Google Cloud / AI Studio usage alert for the Gemini key.

## Recovery and verification commands

```bash
source .venv/bin/activate
PYTHONPATH=. python -m pytest backend/test_main.py -q
npm run typecheck --prefix apps/web
npm run build --prefix apps/web
# two terminals, local dev:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --env-file .env --reload
npm run dev --prefix apps/web
```

## Important product boundaries (unchanged)

- Raw practice messages are not stored by this application. Live inputs are sent to Google for generation.
- Circle members see display names and daily check-ins only. They cannot see private practice text or saved takeaways.
- Anonymous stories never auto-publish. The privacy agent sees the submitted text to sanitize it; raw text is never stored, and the insight agent sees only sanitized text. A human must change a safe row from `pending` to `published`.
- The product is educational. It is not an emergency, clinical, legal or reporting service.
