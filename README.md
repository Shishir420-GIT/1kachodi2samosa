# Dear Men — practise the words, then show up

An English-only agentic learning and accountability application built on the existing 1kachodi2samosa.in campaign. React Router preserves the original design; Python FastAPI runs Google ADK 2.9.0; Supabase powers passwordless accounts, private progress, reminder consent, accountability circles and a moderated anonymous story wall.

## Run locally

Requires Node 24+, Python 3.12 and npm. From this directory:

```bash
npm ci
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env
npm run build
python scripts/start.py
```

Open http://localhost:8080. The default is an explicitly labelled scripted preview. It does not call Gemini. The health endpoint is `/api/health`. The Python API binds only to loopback; React Router forwards bounded requests to it. For frontend development, run `npm run dev` and, in another terminal with the venv active, `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000`.

## Deploy to Cloud Run

Cloud Run requires a billing-enabled Google Cloud project even with `min-instances=0`. Scaling to zero removes idle instance compute; it does not make builds, artifact storage, requests, egress, or overage impossible to bill. The deployment script uses the smallest practical configuration for this demo: one service, 512 MiB RAM, one CPU, request-only CPU, zero minimum instances and one maximum instance.

### 1. Choose the projects

For the lowest model-cost risk, use two projects:

- **Cloud Run project:** billing enabled; put its ID in `GOOGLE_CLOUD_PROJECT`.
- **Gemini key project:** billing disabled; create the restricted Gemini API key there and put only the key in `GOOGLE_API_KEY`.

If one project is used for both, attaching billing for Cloud Run can move its Gemini key onto a paid tier. The application still limits model calls, but that is not a Google billing hard cap.

### 2. Fill `.env`

```bash
cp .env.example .env
```

Fill every non-optional value. Keep `GOOGLE_GENAI_USE_VERTEXAI=false`, `AI_MODE=live`, `DAILY_MODEL_CALL_LIMIT=100`, and use the verified sender subdomain, for example `practice@reminders.1kachodi2samosa.in`. `.env` is ignored by Git and Cloud Build.

The Supabase project must already have both migrations applied:

1. `supabase/schema.sql`
2. `supabase/agentic_mvp.sql`

### 3. Authenticate and deploy

```bash
gcloud auth login
bash scripts/deploy.sh --check
bash scripts/deploy.sh
```

The script performs the following work:

- Enables Cloud Run, Cloud Build, Artifact Registry, IAM and Secret Manager APIs.
- Creates a dedicated `dear-men-runtime` service account.
- uploads Gemini, Supabase, Resend and unsubscribe secrets to Secret Manager without printing them.
- Builds from the Dockerfile and deploys a public `dear-men` service.
- Applies both service-level and revision-level `min=0`, `max=1` limits.
- Sets the discovered Cloud Run URL as `PUBLIC_SITE_URL`.

The deployer needs permission to enable APIs, create service accounts and secrets, build images, deploy Cloud Run, and change IAM policies. A local Docker engine is not required.

### 4. Configure Supabase Auth

Copy the deployment URL printed by the script. In Supabase Authentication → URL Configuration:

- Set **Site URL** to the Cloud Run URL.
- Add `https://YOUR_CLOUD_RUN_URL/dashboard` to Redirect URLs.
- Add `https://YOUR_CLOUD_RUN_URL/#practice` to Redirect URLs.

Then verify a magic link in a signed-out browser.

### 5. Deploy daily reminders

After the website and sign-in work:

```bash
bash scripts/deploy-reminders.sh
```

This deploys one Cloud Run Job using the website's exact image, and a Cloud Scheduler trigger every 15 minutes. Each run selects only due, opted-in users; Resend idempotency prevents duplicate daily delivery. The web service remains at zero minimum instances.

### 6. Verify the live deployment

```bash
curl https://YOUR_CLOUD_RUN_URL/api/health
```

The response must say `ai_mode: live`. Complete a practice and expand “How this response was made”; it must list `ADK coach` and `ADK practice partner`, rather than a scripted fallback. Submit a deliberately fictional story and confirm it enters the Supabase `pending` queue. Open the site in a private mobile window.

Configure a small Google Cloud billing budget alert before sharing the URL. Budget alerts notify; they do not stop charges. To stop compute immediately, delete the service and job:

```bash
gcloud run services delete dear-men --region asia-south1
gcloud run jobs delete dear-men-reminders --region asia-south1
```

Gemini free-tier content may be used by Google to improve its products. Use fictional/anonymized demo material; move sensitive production traffic to a provider tier with appropriate data terms.

## Verification

```bash
npm run typecheck
npm run build
pip install pytest httpx
python -m pytest backend/test_main.py -q
```

`docs/evaluation-cases.json` contains a live evaluation checklist. Automated tests use mocked generation for orchestration; they do not prove model safety or output quality. Record actual live results before claiming success. The initial guidance contains project-authored principles and a short bystander reference, not a professionally reviewed curriculum.

## Architecture and limits

- One Cloud Run container supervises the SSR web process and a private loopback Python process. If either dies, the container exits; the startup probe checks both.
- ADK coach generates schema-validated feedback. A separate ADK practice partner supplies one fictional reply. For story submissions, an ADK moderator gates unsafe material and an ADK insight writer drafts one concrete friend action. AI never publishes a story; accepted submissions remain pending for human review.
- Two practice attempts per UI flow; request size, history and generation time are bounded server-side. Requests are stateless. Restarting an instance does not lose saved Supabase progress; browser history is intentionally transient.
- Public guest access keeps the demo usable. The default deployment scales to zero, permits one instance, bounds each agent to one model call and 700 output tokens, and stops after 100 model calls per process/day. Process restarts reset that daily counter, so it reduces exposure but is not a billing hard cap. Configure a small billing alert and use the Gemini Developer API free tier if zero model charges are required.
- English only. No voice, clinical advice, emergency dispatch or measured real-world impact claims. Milestones measure completed practice actions, not morality.

See `docs/submission.md` for deployment/submission blockers and the deadline checklist.

The daily-return email design and operational notes are in `docs/daily-email-reminders.md`. The preference UI, delivery worker and unsubscribe flow are implemented; `scripts/deploy-reminders.sh` creates the Cloud Run Job and Scheduler trigger after the web service is live.
