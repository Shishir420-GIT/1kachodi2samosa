# Agentic MVP

## Product loop

1. A visitor takes the reality check or practises a difficult moment.
2. The ADK coach turns their wording into a specific reflection and action; the separate practice-partner agent provides bounded role-play.
3. A signed-in user saves the action and earns practice points. Milestone names describe activity, never character or virtue.
4. The user can opt into one daily reminder and share only a daily check-in with a small accountability circle. Raw practice text and private takeaways are never shared with the circle.
5. Anyone can submit an anonymous story. A safety-moderation agent checks it, a support-insight agent drafts what a friend could have done, and the story remains pending until human review.

## Agent boundaries

| Agent | Input | Output | Can publish or contact people? |
| --- | --- | --- | --- |
| Response coach | Bounded scenario, up to four turns, allowlisted guidance | Structured reflection, revised words and next action | No |
| Practice partner | Same fictional scenario and validated coach result | One short fictional reply | No |
| Story moderator | Anonymous title, story and topic | `pending` or `reject` with an internal note | No |
| Support insight writer | A moderator-accepted story | Pattern summary and one practical friend action | No |

All live model calls use per-request in-memory ADK sessions. The application does not persist raw practice conversations. Public story publishing is a human decision made in Supabase by changing a reviewed row from `pending` to `published` and setting `published_at`.

## Trust model

- Browser code receives only the Supabase URL and publishable key. RLS limits signed-in rows.
- The Supabase secret key stays in the Python service and is used only to place anonymous stories into the review queue and, later, deliver opted-in reminders.
- Circle members can see circle membership and daily check-ins. They cannot query another member's commitments or practice events.
- Story submissions reject obvious contact details before model processing and are rate-limited by the web server.
- Emergency language stops role-play. The product does not diagnose, report incidents, dispatch help or invent local services.

## Demo path

1. Complete one practice twice to show coach and practice-partner orchestration.
2. Sign in and open `/dashboard`; show the milestone, reminder consent, and create-circle flow.
3. Open `/stories`; read a composite example, submit a new anonymous account, and show that it enters a pending review queue rather than appearing publicly.
4. In Supabase, show RLS and the pending row. Publish only a deliberately safe demo row if needed for the presentation.
