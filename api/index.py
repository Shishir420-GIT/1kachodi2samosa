"""Vercel Python entrypoint. Exposes the existing FastAPI app unchanged;
vercel.json rewrites every request here so backend/main.py's own routes
(/health, /respond, /stories, /reminders/unsubscribe, /cron/reminders)
resolve exactly as they do locally and did on Cloud Run.

requirements.txt lives both here and at the repo root: Vercel's Python
builder resolves dependencies most reliably from the same directory as the
entrypoint, while the repo-root copy is what local `pip install -r
requirements.txt` uses."""
from backend.main import app  # noqa: F401
