# Dear Men handoff memory

Last updated: 18 October 2026, Asia/Kolkata.

## Current verified state

- Workspace: `/Users/shishir/Workspace/AI-Builder-Cup/horizons-export-c4055a00-722e-4a5b-9202-4dcaafaac043`
- Local app: `http://127.0.0.1:8080`
- Stack: React Router SSR, FastAPI, Google ADK 2.9.0, Supabase and Resend.
- Google ADK is live through the Gemini Developer API. A restricted Gemini-only key is stored in ignored `.env`; never copy it into docs, source, chat or browser code.
- A real practice request completed the coach → practice partner flow with validated structured output.
- A real fictional story completed moderator → support insight → human review queue. Its temporary database row was deleted after verification.
- Health after verification: `AI_MODE=live`, ADK 2.9.0, daily model-call limit 100.
- Supabase migrations are applied. All six agentic tables responded, and the story wall displays two seeded composite examples.
- Resend verified `reminders.1kachodi2samosa.in`. The configured sender on that subdomain was accepted with HTTP 200 using Resend's synthetic `delivered@resend.dev` address. No real recipient was contacted during verification.
- Signed unsubscribe tokens and the `/unsubscribe` flow pass locally.
- Validation: 22 backend tests pass; frontend lint, typecheck and production build pass.

## Cloud status and blocker

- Intended Cloud Run project in the current `.env`: `genai-cohort-2-497718`.
- Region default: `asia-south1`.
- Local gcloud account used: `shishir.workemail@gmail.com`.
- gcloud active project and quota project were changed to `genai-cohort-2-497718`.
- Cloud Run, Cloud Build and Artifact Registry APIs were already enabled.
- Cloud deployment has **not** happened.
- Secret Manager activation failed with `UREQ_PROJECT_BILLING_NOT_OPEN`. A billing account must be linked before `scripts/deploy.sh` can continue.
- Do not assume `min-instances=0` guarantees a zero bill. It removes idle instance compute. Build minutes, image storage, requests, egress and usage beyond free allowances remain possible.

## Cost controls already implemented

- Cloud Run: 512 MiB, one CPU, CPU throttling, startup boost disabled, min 0, max 1 at service and revision levels, concurrency 8.
- Gemini: Developer API route, one model call per agent, 700 maximum output tokens, 100 model calls per process per UTC day.
- API: practice budget 30/minute per process; anonymous stories 5/hour per client plus shared API limits.
- The in-process daily model counter resets if the instance restarts. It is a safety brake, not a billing hard cap.

## Smoothest next steps

1. Read `README.md`, especially “Deploy to Cloud Run.”
2. Decide whether Cloud Run and Gemini should use separate projects. For strictly free Gemini calls, keep the Gemini key in a billing-disabled project and deploy Cloud Run from a different billing-enabled project.
3. Link billing to the selected Cloud Run project.
4. Confirm `.env` contains the Cloud Run project ID and the verified subdomain sender. Do not rotate working secrets unless necessary.
5. Run `bash scripts/deploy.sh`.
6. Put the printed Cloud Run URL into Supabase Auth Site URL and redirect allowlist.
7. Test signed-out practice, passwordless sign-in, dashboard, circle creation, story submission and `/api/health`.
8. Run `bash scripts/deploy-reminders.sh` only after the website and auth work.
9. Add a small Google Cloud budget alert and record the final public URL in `docs/submission.md`.

## Recovery and verification commands

```bash
source .venv/bin/activate
PYTHONPATH=. python -m pytest -q
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm run build --prefix apps/web
python scripts/start.py
```

To inspect a deployment:

```bash
gcloud run services describe dear-men --region asia-south1
gcloud run services logs read dear-men --region asia-south1 --limit 100
```

To halt Cloud Run resources:

```bash
gcloud run services delete dear-men --region asia-south1
gcloud run jobs delete dear-men-reminders --region asia-south1
gcloud scheduler jobs delete dear-men-reminders --location asia-south1
```

## Important product boundaries

- Raw practice messages are not stored by this application. Live inputs are sent to Google for generation.
- Circle members see display names and daily check-ins only. They cannot see private practice text or saved takeaways.
- Anonymous stories never auto-publish. AI prepares moderation and support insight; a human must change a safe row from `pending` to `published`.
- The product is educational. It is not an emergency, clinical, legal or reporting service.
