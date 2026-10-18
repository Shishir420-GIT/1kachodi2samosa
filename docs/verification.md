# Verification record — 18 October 2026

## Passed locally

- TypeScript typecheck (`npm run typecheck`).
- Production frontend/SSR build (`npm run build`).
- 14 backend tests, including the real ADK 2.9 runner with a fake model, schema validation, orchestration, urgent pause, and labelled fallback.
- Production server started through `scripts/start.py`; both services reachable through `/api/health`.
- Production CSS and JavaScript asset URLs return `200` with the correct MIME types; this fixes the previously unstyled production preview.
- Desktop and 390×844 mobile browser rendering visually match the established cream, wine and muted-blue design. The practice textarea, submit action, transcript and scripted feedback state were exercised successfully after hydration.
- Local Supabase configuration is loaded: the Auth service responds, the user-owned `commitments` table cannot be enumerated anonymously, and the `reminder_preferences` table exists. The browser configuration exposes only the project URL and publishable key; the secret key remains server-only.
- Resend API authentication and simulated delivery through `onboarding@resend.dev` pass. The configured `1kachodi2samosa.in` sender is rejected until that domain is verified in Resend; no real recipient was contacted during this check.
- HTTP smoke checks: homepage SSR, public configuration without credentials, all three scenario responses, urgent pause, cross-origin POST rejection, declared and chunked body-size limits, malformed JSON, invalid schema, GET rejection, and per-process quota.
- `npm audit --omit=dev`: zero known production dependency vulnerabilities after patch updates and moving the build-only Tailwind animation plugin to dev dependencies.
- Deployment shell syntax check.

## Not verified

- A complete keyboard-only pass remains unverified.
- Docker image build: no local Docker executable. Cloud Build has not been run.
- Live Gemini output, latency or safety evaluation: project/model credentials not configured. Mocked model tests are not live model evaluation.
- Supabase magic-link delivery, database migration, persistence and cross-user isolation: project placeholders remain.
- Cloud Run deployment, public repository, video, prescribed deck and final submission.

## Remaining dependency limitation

The full npm audit reports seven development/build dependency findings (five high, two moderate) in the existing Tailwind 3 toolchain. Resolving them through the offered major Tailwind upgrade requires a separate compatibility pass. These packages are pruned from the runtime image. Do not describe the entire dependency tree as vulnerability-free.
