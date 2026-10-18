# Submission working notes — 18 October 2026, IST

Owner-provided milestones: reachable deployment by 14:00; live demo recording, prescribed deck and description by 16:00; submit by 18:00. Hard cutoff: **23:59 IST**, with no edits afterward.

## Honest current status

Local implementation exists. Google Cloud and Supabase remain placeholders. No live deployment, live model evaluation, public repository, video, prescribed deck or submission is confirmed. Do not claim these are complete until verified.

## Draft description

Dear Men helps men practise constructive responses to everyday sexism, ignored boundaries and bystander situations. An awareness website can explain what to do; the difficult part is finding the words when a friend pushes back.

The prototype preserves the campaign's editorial design and adds short conversational rehearsals. A Google ADK 2.9 coach uses supplied guidance to give specific feedback; a separate practice partner reacts to the user's wording. Users can revise their response and save one practical takeaway. A response helper offers language for an anonymised situation. Source references, bounded turns and clearly labelled fallback examples make the experience inspectable.

The application is packaged for Google Cloud Run. Supabase provides optional email authentication and user-owned saved takeaways protected by Row Level Security. Guest access lets judges try the experience without an account. The initial release is English-only. Completion and improved practice responses are learning signals, not evidence of reduced real-world harm.

Before submitting, replace “packaged for” with “deployed on” only after verifying the actual Cloud Run URL. Describe Supabase as integrated only after testing the configured project.

## Demo outline (target under 3 minutes; confirm actual submission limit)

- 0:00–0:20 — Show the campaign and describe the gap between knowing and speaking up.
- 0:20–1:15 — On the live URL, pick the joke scenario, enter a response, show fictional pushback and specific feedback.
- 1:15–1:45 — Revise the response, compare attempts, save one takeaway.
- 1:45–2:10 — Show the response helper and source link. Briefly show the explicit urgent-situation pause.
- 2:10–2:40 — Show the ADK workflow, Cloud Run service and optional Supabase persistence if configured.
- 2:40–2:55 — State measured evaluation results and limitations. Do not invent user counts or impact.

## Required inputs still missing

- Google Cloud project and deployment access; Gemini model access.
- Supabase project configuration if cross-device progress is included.
- The organiser's prescribed deck template and final submission field requirements.
- Public GitHub repository destination, and video hosting destination.

Do not substitute a custom deck for the prescribed template. The draft description and outline are preparation, not completed submission artifacts.

## Final checks

- [ ] Live prototype works signed out, in a private window and on mobile.
- [ ] A live response completes through Gemini; fallback is not passed off as live AI.
- [ ] GitHub repository is public and contains no credentials.
- [ ] Submitted video URL plays for a signed-out viewer; duration meets guidelines.
- [ ] Deck uses prescribed template and requested export format.
- [ ] Save the form, reopen it, and verify all five required fields are present.
