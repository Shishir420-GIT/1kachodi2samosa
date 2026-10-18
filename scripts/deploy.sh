#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo 'Missing .env. Copy .env.example to .env and fill it first.' >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env
set +a

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-}"
REGION="${CLOUD_RUN_REGION:-asia-south1}"
SERVICE="${CLOUD_RUN_SERVICE:-dear-men}"
RUNTIME_ACCOUNT_NAME="dear-men-runtime"
RUNTIME_ACCOUNT="${RUNTIME_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

required=(GOOGLE_CLOUD_PROJECT GOOGLE_API_KEY SUPABASE_URL SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY RESEND_API_KEY REMINDER_FROM_EMAIL UNSUBSCRIBE_SIGNING_SECRET)
for name in "${required[@]}"; do
  value="${!name:-}"
  if [[ -z "$value" || "$value" == *YOUR_* || "$value" == SET_IN_SECRET_MANAGER ]]; then
    echo "Set $name in .env before deploying." >&2
    exit 1
  fi
done
if [[ ${#UNSUBSCRIBE_SIGNING_SECRET} -lt 64 ]]; then
  echo 'UNSUBSCRIBE_SIGNING_SECRET must contain at least 32 random bytes (64 hex characters).' >&2
  exit 1
fi

command -v gcloud >/dev/null || { echo 'Install the Google Cloud CLI first.' >&2; exit 1; }
if [[ "${1:-}" == '--check' ]]; then
  echo "Preflight passed for service ${SERVICE} in ${REGION}. No cloud resources were changed."
  exit 0
fi
gcloud auth print-access-token >/dev/null
gcloud config set project "$PROJECT_ID" --quiet
gcloud config set billing/quota_project "$PROJECT_ID" --quiet

echo 'Enabling deployment APIs (billing must already be linked)...'
gcloud services enable \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com iam.googleapis.com cloudresourcemanager.googleapis.com \
  --project "$PROJECT_ID" --quiet

if ! gcloud iam service-accounts describe "$RUNTIME_ACCOUNT" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$RUNTIME_ACCOUNT_NAME" \
    --display-name='Dear Men Cloud Run runtime' --project "$PROJECT_ID" --quiet
fi

put_secret() {
  local secret_name="$1" env_name="$2" value="${!2}"
  if ! gcloud secrets describe "$secret_name" --project "$PROJECT_ID" >/dev/null 2>&1; then
    gcloud secrets create "$secret_name" --replication-policy=automatic --project "$PROJECT_ID" --quiet
  fi
  printf '%s' "$value" | gcloud secrets versions add "$secret_name" --data-file=- --project "$PROJECT_ID" --quiet >/dev/null
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --member="serviceAccount:${RUNTIME_ACCOUNT}" --role='roles/secretmanager.secretAccessor' \
    --project "$PROJECT_ID" --quiet >/dev/null
}

echo 'Uploading server-only values to Secret Manager...'
put_secret dear-men-google-api-key GOOGLE_API_KEY
put_secret dear-men-supabase-secret SUPABASE_SECRET_KEY
put_secret dear-men-resend-api-key RESEND_API_KEY
put_secret dear-men-unsubscribe-secret UNSUBSCRIBE_SIGNING_SECRET

echo 'Building and deploying the service...'
gcloud run deploy "$SERVICE" --source . --project "$PROJECT_ID" --region "$REGION" \
  --service-account "$RUNTIME_ACCOUNT" --allow-unauthenticated --port 8080 \
  --memory 512Mi --cpu 1 --cpu-throttling --no-cpu-boost \
  --min 0 --max 1 --min-instances 0 --max-instances 1 --concurrency 8 --timeout 60 \
  --set-env-vars "AI_MODE=live,GOOGLE_GENAI_USE_VERTEXAI=false,GEMINI_MODEL=${GEMINI_MODEL:-gemini-flash-latest},DAILY_MODEL_CALL_LIMIT=${DAILY_MODEL_CALL_LIMIT:-100},SUPABASE_URL=${SUPABASE_URL},SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY},REMINDER_FROM_EMAIL=${REMINDER_FROM_EMAIL},PUBLIC_SITE_URL=https://pending.invalid" \
  --set-secrets 'GOOGLE_API_KEY=dear-men-google-api-key:latest,SUPABASE_SECRET_KEY=dear-men-supabase-secret:latest,RESEND_API_KEY=dear-men-resend-api-key:latest,UNSUBSCRIBE_SIGNING_SECRET=dear-men-unsubscribe-secret:latest' \
  --startup-probe=httpGet.path=/api/health,initialDelaySeconds=5,periodSeconds=5,failureThreshold=24,timeoutSeconds=3 \
  --quiet

SERVICE_URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
gcloud run services update "$SERVICE" --project "$PROJECT_ID" --region "$REGION" \
  --update-env-vars "PUBLIC_SITE_URL=${SERVICE_URL}" --min 0 --max 1 --quiet >/dev/null

echo
echo "Deployment complete: ${SERVICE_URL}"
echo "Health: ${SERVICE_URL}/api/health"
echo 'Next: add this URL to Supabase Auth URL Configuration, then run scripts/deploy-reminders.sh.'
