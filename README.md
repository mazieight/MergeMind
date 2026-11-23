# MergeMind

The first foundation slice of the hackathon coordination platform described in AGENTS.md.

## License

Original MergeMind code is copyright (c) 2026 Saad Lamaizi and licensed under the [MIT License](LICENSE). Third-party components and assets retain their own licenses and attribution requirements. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Run locally

Requires Node.js 24+ and npm.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. Without environment variables, the app displays setup guidance. It does not simulate activity or persist demo data.

## Connect Supabase

1. Create a Supabase project, or initialize and start a local project with the Supabase CLI (`npx supabase init`, `npx supabase start`; local Supabase requires Docker).
2. Copy `.env.example` to `.env.local`. Set the URL and publishable key (local CLI: anon key). Never use a service-role key in a public variable.
3. Apply `supabase/migrations/202611140001_foundation.sql` to a fresh database. For local development use `npx supabase db reset`; this resets the local database. For a hosted project use `npx supabase link --project-ref YOUR_PROJECT_REF`, then `npx supabase db push`.
4. Create test accounts in Supabase Auth after applying the migration; the auth trigger creates profiles. Existing Auth users need profile backfilling before using the application.
5. Restart Next.js and sign in at `/login` with an account's email/password.
6. Create an event, create a team, then add existing accounts using the account ID shown on their workspace home. Assign a lead explicitly.

The SQL migration is the source of truth for permissions. API calls use the signed-in user's cookies and publishable key. No service-role client is used. Event creation and organizer membership happen in one transaction. Read policies scope events and teams to membership; only narrow, authorized RPCs can mutate the foundation tables.

Auth follows [Supabase's SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client): cookies are refreshed in the Next.js proxy, and server reads validate identity with `getUser()`.

## Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Authorization tests execute the migration in PGlite (PostgreSQL WASM) with simulated Supabase auth roles and JWT identity. They cover actual row-level policies, anonymous access, role escalation, cross-team isolation, lead scope, read-only roles, and duplicate constraints. They do not replace testing the deployed Supabase Auth / PostgREST stack.

## Implemented

- Next.js App Router, TypeScript, Tailwind, linting, formatting, environment parsing.
- Setup screen, password sign-in/sign-out, event list and creation, team creation, existing-account membership UI.
- Profiles, events, teams, memberships, indexes, RLS, and transactional authorized mutation RPCs.
- Versioned APIs with strict input validation and consistent JSON errors.

## Next foundation work

Milestone 1 is **in progress**, not complete. Remaining work: email invitations and acceptance, membership editing/removal with last-lead safeguards, event membership management, account recovery, profile display names for teammates, audit UI, explicit retry idempotency keys, generated Supabase database types, and live Supabase integration/end-to-end tests. Hosted Supabase has not been provisioned by this scaffold.

GitHub ingestion, tasks, AI, and realtime are subsequent milestones. The app makes no GitHub requests and generates no recommendations yet.

## Verification of this slice

- 10 tests passed, including PostgreSQL RLS and authorization cases.
- Lint, TypeScript, formatting, and production build passed.
- Production server smoke check: `/` returns 200 and displays setup guidance; unconfigured `POST /api/v1/events` returns 503 with a structured configuration error.
- Production dependency audit: zero reported vulnerabilities. Full audit currently reports seven moderate development-only entries from the TypeScript ESLint/minimatch dependency chain; `npm audit fix` did not resolve them. No forced dependency upgrades were applied.
- Live login, event setup, and membership flows still require a configured Supabase project and end-to-end verification.

## Guided presentation demo

Open `/demo`. Follow the single green button through eight scenes in four chapters. The current actor and their workspace change automatically. No Supabase configuration is needed.

| Scene                  | Workspace | Presenter action                   |
| ---------------------- | --------- | ---------------------------------- |
| 1. Team goal           | Mohammed  | Show the new work update           |
| 2. Code update         | Saad      | Show the AI suggestion             |
| 3. Suggested task      | Mohammed  | Approve task and assign Saad       |
| 4. Sample result check | Aymen     | Confirm the sample check passed    |
| 5. Blocked checkout    | Mehdi     | Report the blocker to Mohammed     |
| 6. Available teammate  | Mohammed  | Reassign the checkout task to Saad |
| 7. Handoff notes       | Saad      | Pick up the task                   |
| 8. Shared overview     | Mohammed  | Finish the talk or replay          |

**Previous** rewinds the sample state by one scene. **Start again** resets the entire story. **Show speaker notes** reveals the current talk track. **Explore each member’s workspace** lets you inspect personal views at any scene without altering shared work. Returning to the guided view restores the scene’s actor. Keep exploration closed during the short version.

The approval and result-confirmation buttons are human decisions in a scripted simulation. No step calls GitHub, an AI model, or a task mutation API. Rewinding is a presentation control, not a production undo feature. The handoff preserves the same task and notes, keeps progress at 2 of 4 completed tasks, and leaves the blocker under investigation. Saad becomes available only after both of his current tasks are confirmed done.

### Two-speaker presentation plan

The six-slide PowerPoint at `presentation/MergeMind-final.pptx` includes full speaker notes, exact click cues, and demo screenshots as a fallback. Use this file rather than the incomplete cloud draft, which stopped syncing during authoring. Target: four minutes, within a three-to-five-minute slot.

| Time      | Speaker   | Content                                                         |
| --------- | --------- | --------------------------------------------------------------- |
| 0:00–0:15 | Speaker 1 | Introduce MergeMind and the team                                |
| 0:15–0:55 | Speaker 1 | Problem: one teammate is stuck while another is available       |
| 0:55–1:35 | Speaker 1 | Solution: connect goals and code evidence, with human decisions |
| 1:35–2:25 | Speaker 2 | Guided demo: update, AI suggestion, approval, and confirmation  |
| 2:25–3:30 | Speaker 2 | Guided demo: blocker, available teammate, handoff, and overview |
| 3:30–4:00 | Speaker 2 | Value, honest prototype scope, next step, and thanks            |

Handoff line for Speaker 1: “I’ll now hand over to show the process and how the lead helps a blocked teammate.”

Before presenting, open the deck and `http://localhost:3000/demo` in separate tabs. Click **Start again**, leave notes hidden, and rehearse the seven green-button actions. Speaker 2 takes the mouse when the live demo begins. If the browser is unavailable, use the two screenshot slides and narrate the same process.

For **three minutes**, use 60 seconds for the opening/problem/solution, 90 seconds for the demo, and 30 seconds for the close. For **five minutes**, add 45 seconds exploring Saad’s and Mehdi’s final workspaces and 15 seconds explaining the preserved handoff notes. Timing depends on speaking pace; rehearse once aloud.

Browser checks: after `npm run build`, run `npx playwright install chromium` once, then `npm run test:e2e`. Tests start a separate server on port 3001 and cover the whole guided process, approval, task counts, availability, notes, member views, rewind/reset, and mobile width across all scenes.
