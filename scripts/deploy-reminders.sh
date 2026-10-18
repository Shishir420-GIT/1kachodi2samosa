#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -f .env ]] || { echo 'Missing .env.' >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source .env
set +a

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT in .env}"
REGION="${CLOUD_RUN_REGION:-asia-south1}"
SERVICE="${CLOUD_RUN_SERVICE:-dear-men}"
JOB="dear-men-reminders"
RUNTIME_ACCOUNT="dear-men-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
SCHEDULER_ACCOUNT="dear-men-scheduler@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud services enable run.googleapis.com cloudscheduler.googleapis.com --project "$PROJECT_ID" --quiet
SERVICE_URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
IMAGE="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(spec.template.spec.containers[0].image)')"
[[ -n "$SERVICE_URL" && -n "$IMAGE" ]] || { echo 'Deploy the web service first.' >&2; exit 1; }

gcloud run jobs deploy "$JOB" --image "$IMAGE" --project "$PROJECT_ID" --region "$REGION" \
  --service-account "$RUNTIME_ACCOUNT" --tasks 1 --max-retries 1 --task-timeout 5m \
  --command python --args=-m,backend.send_reminders,--send \
  --set-env-vars "SUPABASE_URL=${SUPABASE_URL},REMINDER_FROM_EMAIL=${REMINDER_FROM_EMAIL},PUBLIC_SITE_URL=${SERVICE_URL}" \
  --set-secrets 'SUPABASE_SECRET_KEY=dear-men-supabase-secret:latest,RESEND_API_KEY=dear-men-resend-api-key:latest,UNSUBSCRIBE_SIGNING_SECRET=dear-men-unsubscribe-secret:latest' \
  --quiet

if ! gcloud iam service-accounts describe "$SCHEDULER_ACCOUNT" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create dear-men-scheduler \
    --display-name='Dear Men reminder scheduler' --project "$PROJECT_ID" --quiet
fi
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SCHEDULER_ACCOUNT}" --role='roles/run.invoker' --quiet >/dev/null

RUN_URI="https://run.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB}:run"
if gcloud scheduler jobs describe "$JOB" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud scheduler jobs update http "$JOB" --location "$REGION" --project "$PROJECT_ID" \
    --schedule='*/15 * * * *' --time-zone='Etc/UTC' --uri="$RUN_URI" --http-method=POST \
    --oauth-service-account-email="$SCHEDULER_ACCOUNT" --oauth-token-scope='https://www.googleapis.com/auth/cloud-platform' \
    --headers='Content-Type=application/json' --message-body='{}' --quiet
else
  gcloud scheduler jobs create http "$JOB" --location "$REGION" --project "$PROJECT_ID" \
    --schedule='*/15 * * * *' --time-zone='Etc/UTC' --uri="$RUN_URI" --http-method=POST \
    --oauth-service-account-email="$SCHEDULER_ACCOUNT" --oauth-token-scope='https://www.googleapis.com/auth/cloud-platform' \
    --headers='Content-Type=application/json' --message-body='{}' --quiet
fi

echo "Reminder job deployed. Dry-run test: gcloud run jobs execute ${JOB} --region ${REGION} --project ${PROJECT_ID} --args=-m,backend.send_reminders"
