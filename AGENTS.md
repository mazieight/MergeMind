# MergeMind — Agent Instructions

## Foundation implementation notes (2026-11-14)

- `/demo` is a presentation-only, in-memory simulation with explicitly labeled fictional data and scripted AI output. It never calls GitHub, an LLM, or mutation APIs; approval and completion are separate human clicks. It does not represent completion of the integration milestones.

- Foundation writes use narrow, membership-authorized PostgreSQL RPCs; browser roles have SELECT-only grants on core tables with RLS.
- `permission_audit` records foundation creation/membership actions transactionally and is inaccessible to browser roles.
- Initial account provisioning uses Supabase Auth administration; existing accounts can be added to teams by UUID. Email invitations and membership lifecycle management remain unfinished Milestone 1 work.
- Local database-policy tests run the actual migration in PGlite with simulated Supabase auth roles. Live Supabase integration verification is still required.

## 1. Product overview

MergeMind is an AI-powered coordination platform for hackathons. It connects multiple GitHub repositories to each team, tracks real development activity, understands project goals, and recommends useful next tasks to individual developers and team leads.

**Product promise:** GitHub shows what developers changed. MergeMind explains what that means for project progress, what is blocking the team, and what should happen next.

### Final product decisions

- **Repository structure:** Multiple GitHub repositories can belong to one team.
- **Project understanding:** Both human-provided project goals and AI analysis of repository documentation/code diffs.
- **Task creation:** AI generates task proposals. Humans approve, edit, assign, or reject them. Do not silently create or assign tasks.
- **GitHub code access:** Read GitHub metadata and selected code diffs. Do not clone or ingest entire repositories by default.
- **AI audiences:** Individual developers and team leads.
- **GitHub permissions:** Read-only for the MVP.
- **Source of truth:** MergeMind database for tasks, assignments, project goals, and approvals; GitHub for repository activity and source changes.

## 2. Product principles

1. Treat events, teams, users, repositories, tasks, and contributions as separate entities.
2. A team can connect many repositories; a task can reference many repositories.
3. A developer can belong to a team and contribute to multiple connected repositories.
4. Never equate commit count with productivity or task completion.
5. Every AI recommendation must explain its reasoning and cite supporting evidence from project goals, tasks, or GitHub activity.
6. Keep AI actions human-approved. The AI may propose; it must not merge PRs, push commits, change repository settings, or silently assign work.
7. Enforce event/team membership and role-based access on every API and database operation.
8. Design webhook processing to be idempotent, asynchronous, observable, and retryable.

## 3. Roles and permissions

- **Organizer:** Creates events, manages teams, sees event-wide progress, and manages event membership.
- **Team lead:** Manages team goals, repositories, tasks, assignments, and team-level recommendations.
- **Developer:** Sees their tasks and team activity; can accept, reject, or request changes to recommendations and update task status.
- **Viewer / mentor:** Read-only access to explicitly shared event or team dashboards.

A user may hold different roles in different events or teams. Do not store a single global role as the authorization source.

## 4. Core user journeys

### Event setup
1. Organizer creates an event.
2. Organizer creates teams and invites members.
3. Team lead enters the project description, goals, feature requirements, and optional acceptance criteria.
4. Team lead connects one or more GitHub repositories to the team using the MergeMind GitHub App.
5. MergeMind imports repository metadata and relevant README/documentation context.
6. AI proposes an initial task breakdown. Team lead reviews and approves proposals.

### Developer workflow
1. Developer links their GitHub identity to their MergeMind account.
2. Developer sees assigned tasks and relevant repository activity.
3. GitHub pushes, PRs, reviews, and issue events update the activity timeline.
4. MergeMind analyzes relevant diffs and compares evidence with existing tasks and project goals.
5. AI creates task recommendations for the developer and team lead.
6. A human approves, edits, rejects, or assigns a proposal.
7. Approved tasks appear in the team's task board and relevant developer's task list.

### Team lead workflow
- View team progress across all connected repositories.
- See tasks, task ownership, blockers, PR state, and recent activity.
- Review AI-generated team recommendations.
- Approve, edit, reject, or assign proposed tasks.
- Identify dependencies between repositories or developers.

### Organizer workflow
- View all teams in the event.
- Compare task-based progress and activity freshness.
- Identify teams reporting blockers or requesting help.
- Do not expose private repository code or sensitive diffs to organizers unless explicitly authorized.

## 5. Recommended technology

### MVP stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS.
- Backend: Next.js route handlers or a separate TypeScript API service.
- Database/auth: Supabase PostgreSQL and Supabase Auth.
- Realtime: Supabase Realtime; use Broadcast for authorized scalable updates where appropriate.
- Background processing: a durable job queue/worker. For a small MVP, use a Postgres-backed queue or Supabase Edge Functions plus a durable jobs table; avoid doing AI work inside webhook requests.
- GitHub integration: GitHub App with webhooks and installation tokens.
- AI: provider-agnostic LLM adapter with structured JSON outputs and strict validation.
- Hosting: Vercel for web/API and a suitable worker host for background jobs.

## 6. Database schema

Use UUID primary keys, `timestamptz` timestamps, foreign keys, indexes, and `created_at` / `updated_at` where appropriate. Use database migrations checked into version control.

The following is the logical schema. Add RLS policies and constraints in migrations.

### `profiles`
- `id uuid primary key references auth.users(id)`
- `display_name text not null`
- `avatar_url text null`
- `github_user_id bigint unique null`
- `github_login text null`
- `created_at timestamptz`
- `updated_at timestamptz`

### `events`
- `id uuid primary key`
- `name text not null`
- `slug text unique not null`
- `description text null`
- `starts_at timestamptz null`
- `ends_at timestamptz null`
- `created_by uuid references profiles(id)`
- `created_at`, `updated_at`

### `event_members`
- `id uuid primary key`
- `event_id uuid references events(id) on delete cascade`
- `user_id uuid references profiles(id) on delete cascade`
- `role text check in ('organizer','viewer')`
- `created_at`
- Unique `(event_id, user_id)`

### `teams`
- `id uuid primary key`
- `event_id uuid references events(id) on delete cascade`
- `name text not null`
- `description text null`
- `project_summary text null`
- `project_goals jsonb not null default '[]'`
- `status text check in ('active','paused','completed')`
- `created_at`, `updated_at`

### `team_members`
- `id uuid primary key`
- `team_id uuid references teams(id) on delete cascade`
- `user_id uuid references profiles(id) on delete cascade`
- `role text check in ('lead','developer','mentor')`
- `responsibilities text[] not null default '{}'`
- `created_at`
- Unique `(team_id, user_id)`

### `repositories`
- `id uuid primary key`
- `team_id uuid references teams(id) on delete cascade`
- `github_repository_id bigint unique not null`
- `installation_id bigint not null`
- `owner_login text not null`
- `name text not null`
- `full_name text not null`
- `default_branch text null`
- `private boolean not null default true`
- `html_url text not null`
- `is_active boolean not null default true`
- `last_synced_at timestamptz null`
- `created_at`, `updated_at`

A repository belongs to one team in the MVP. If shared repositories become a requirement, replace `team_id` with a `team_repositories` join table.

### `tasks`
- `id uuid primary key`
- `team_id uuid references teams(id) on delete cascade`
- `title text not null`
- `description text null`
- `status text check in ('proposed','backlog','todo','in_progress','blocked','in_review','done','cancelled')`
- `priority text check in ('low','medium','high','critical')`
- `source text check in ('human','ai')`
- `created_by uuid references profiles(id) null`
- `approved_by uuid references profiles(id) null`
- `assignee_id uuid references profiles(id) null`
- `acceptance_criteria jsonb not null default '[]'`
- `estimated_effort numeric null`
- `due_at timestamptz null`
- `completed_at timestamptz null`
- `created_at`, `updated_at`

AI-created tasks start as `proposed`. Only human approval changes them into actionable statuses.

### `task_repositories`
- `task_id uuid references tasks(id) on delete cascade`
- `repository_id uuid references repositories(id) on delete cascade`
- `relevance_note text null`
- Primary key `(task_id, repository_id)`

### `task_dependencies`
- `id uuid primary key`
- `task_id uuid references tasks(id) on delete cascade`
- `depends_on_task_id uuid references tasks(id) on delete cascade`
- `dependency_type text check in ('blocks','relates_to')`
- Unique `(task_id, depends_on_task_id)`
- Check task and dependency are different.

### `github_events`
- `id uuid primary key`
- `delivery_id text unique not null`
- `installation_id bigint null`
- `repository_id uuid references repositories(id) on delete set null`
- `github_repository_id bigint null`
- `sender_github_id bigint null`
- `event_type text not null`
- `action text null`
- `payload jsonb not null`
- `processing_status text check in ('received','queued','processing','processed','failed','ignored')`
- `received_at timestamptz not null`
- `processed_at timestamptz null`
- `error_message text null`

Store only the payload fields needed for the product. Set retention limits and avoid storing secrets or unnecessary personal data.

### `contributions`
- `id uuid primary key`
- `team_id uuid references teams(id) on delete cascade`
- `repository_id uuid references repositories(id) on delete cascade`
- `user_id uuid references profiles(id) on delete set null`
- `github_event_id uuid references github_events(id) on delete set null`
- `contribution_type text not null` (push, commit, pull_request, review, issue, etc.)
- `external_id text null`
- `title text null`
- `url text null`
- `branch_name text null`
- `commit_sha text null`
- `files_changed jsonb not null default '[]'`
- `diff_summary text null`
- `occurred_at timestamptz not null`
- `created_at`

Use a unique constraint on an appropriate `(repository_id, contribution_type, external_id)` combination when external IDs are available.

### `recommendations`
- `id uuid primary key`
- `team_id uuid references teams(id) on delete cascade`
- `target_user_id uuid references profiles(id) on delete set null`
- `target_role text check in ('developer','lead')`
- `recommendation_type text not null` (create_task, prioritize_task, unblock, coordinate, review, etc.)
- `title text not null`
- `description text not null`
- `reasoning text not null`
- `priority text check in ('low','medium','high','critical')`
- `confidence numeric null`
- `proposed_payload jsonb not null`
- `status text check in ('pending','approved','rejected','edited','expired')`
- `approved_by uuid references profiles(id) null`
- `resulting_task_id uuid references tasks(id) null`
- `expires_at timestamptz null`
- `created_at`, `updated_at`

### `recommendation_evidence`
- `id uuid primary key`
- `recommendation_id uuid references recommendations(id) on delete cascade`
- `contribution_id uuid references contributions(id) on delete set null`
- `task_id uuid references tasks(id) on delete set null`
- `evidence_note text not null`
- `created_at`

### `activity_feed`
- `id uuid primary key`
- `event_id uuid references events(id) on delete cascade`
- `team_id uuid references teams(id) on delete cascade`
- `actor_user_id uuid references profiles(id) on delete set null`
- `activity_type text not null`
- `entity_type text null`
- `entity_id uuid null`
- `summary text not null`
- `metadata jsonb not null default '{}'`
- `created_at`

### `blockers`
- `id uuid primary key`
- `team_id uuid references teams(id) on delete cascade`
- `task_id uuid references tasks(id) on delete set null`
- `reported_by uuid references profiles(id)`
- `title text not null`
- `description text not null`
- `status text check in ('open','investigating','resolved')`
- `severity text check in ('low','medium','high','critical')`
- `resolved_at timestamptz null`
- `created_at`, `updated_at`

### `ai_analysis_runs`
- `id uuid primary key`
- `team_id uuid references teams(id) on delete cascade`
- `trigger_type text not null`
- `status text check in ('queued','running','completed','failed')`
- `input_fingerprint text not null`
- `model_name text null`
- `result jsonb null`
- `error_message text null`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `created_at`

Use `input_fingerprint` to avoid repeating expensive analysis for unchanged context.

### `github_installations`
- `id uuid primary key`
- `github_installation_id bigint unique not null`
- `account_login text not null`
- `account_type text null`
- `created_by uuid references profiles(id)`
- `created_at`, `updated_at`

Keep GitHub App private keys in server-side secrets management, never in this table or browser-accessible storage.

### Important indexes
- `repositories(team_id)`, `repositories(github_repository_id)`
- `team_members(user_id, team_id)`, `event_members(user_id, event_id)`
- `tasks(team_id, status)`, `tasks(assignee_id, status)`
- `github_events(delivery_id)`, `github_events(processing_status, received_at)`
- `contributions(team_id, occurred_at desc)`, `contributions(user_id, occurred_at desc)`
- `recommendations(team_id, status, created_at desc)`, `recommendations(target_user_id, status)`
- `activity_feed(event_id, created_at desc)`

## 7. API endpoints

Use `/api/v1` and return consistent JSON errors. Require authentication except for the GitHub webhook and OAuth callback routes, which must use their own signature/state verification.

### Events and teams
- `POST /api/v1/events` — create event.
- `GET /api/v1/events/:eventId` — event details.
- `GET /api/v1/events/:eventId/dashboard` — event-wide team overview.
- `POST /api/v1/events/:eventId/teams` — create team.
- `GET /api/v1/events/:eventId/teams` — list teams.
- `GET /api/v1/teams/:teamId` — team details.
- `PATCH /api/v1/teams/:teamId` — update team/project details.
- `GET /api/v1/teams/:teamId/members` — list members.
- `POST /api/v1/teams/:teamId/members` — invite/add member.
- `PATCH /api/v1/teams/:teamId/members/:memberId` — change team role/responsibilities.
- `DELETE /api/v1/teams/:teamId/members/:memberId` — remove member.

### Project understanding
- `PUT /api/v1/teams/:teamId/project-context` — save human-provided project summary, goals, requirements and acceptance criteria.
- `POST /api/v1/teams/:teamId/project-context/analyze` — queue AI analysis of README/docs and selected repository context.
- `GET /api/v1/teams/:teamId/project-context` — retrieve combined human and AI project context.

### GitHub
- `GET /api/v1/github/installations` — list installations accessible to the current user.
- `GET /api/v1/github/installations/:installationId/repositories` — list repositories available to an installation.
- `POST /api/v1/teams/:teamId/repositories` — connect selected repository to a team.
- `GET /api/v1/teams/:teamId/repositories` — list connected repositories.
- `DELETE /api/v1/teams/:teamId/repositories/:repositoryId` — disconnect repository.
- `POST /api/v1/github/webhook` — receive GitHub webhook; verify `X-Hub-Signature-256`, persist delivery, enqueue processing, and return quickly.
- `GET /api/v1/repositories/:repositoryId/activity` — repository activity.
- `GET /api/v1/teams/:teamId/contributions` — combined activity across team repositories.

### Tasks
- `POST /api/v1/teams/:teamId/tasks` — create a human-authored task.
- `GET /api/v1/teams/:teamId/tasks` — list/filter tasks.
- `GET /api/v1/tasks/:taskId` — task details and evidence.
- `PATCH /api/v1/tasks/:taskId` — update status, description, priority or assignee.
- `POST /api/v1/tasks/:taskId/dependencies` — add dependency.
- `DELETE /api/v1/tasks/:taskId/dependencies/:dependencyId` — remove dependency.

### AI recommendations
- `POST /api/v1/teams/:teamId/recommendations/generate` — queue recommendation generation.
- `GET /api/v1/teams/:teamId/recommendations` — list team recommendations.
- `GET /api/v1/users/me/recommendations` — personal recommendations.
- `POST /api/v1/recommendations/:recommendationId/approve` — approve proposal; create task or perform explicitly supported action in a transaction.
- `POST /api/v1/recommendations/:recommendationId/reject` — reject with optional reason.
- `PATCH /api/v1/recommendations/:recommendationId` — edit proposal before approval.

### Blockers and activity
- `POST /api/v1/teams/:teamId/blockers` — report blocker.
- `GET /api/v1/teams/:teamId/blockers` — list blockers.
- `PATCH /api/v1/blockers/:blockerId` — update or resolve blocker.
- `GET /api/v1/events/:eventId/activity` — event activity feed.
- `GET /api/v1/teams/:teamId/activity` — team activity feed.

### API behavior
- Validate every request with a schema validator.
- Use pagination for activity, contributions, tasks, and recommendations.
- Use idempotency keys for operations that may be retried.
- Never trust a client-supplied `team_id`, `event_id`, or role without checking membership and authorization.
- Return `202 Accepted` for queued analysis jobs and expose job/run status.
- Use database transactions when approving recommendations and creating tasks.

## 8. GitHub webhook and diff processing

### Webhook handler
1. Read the raw request body.
2. Verify `X-Hub-Signature-256` using the GitHub App webhook secret.
3. Read `X-GitHub-Delivery` and reject duplicate delivery IDs.
4. Persist the event and minimal required payload.
5. Enqueue processing and return a 2xx response promptly.

### Event processor
- Resolve installation and repository IDs.
- Ignore repositories not connected to an active MergeMind team.
- Map sender GitHub ID to a MergeMind profile; preserve an unknown actor if not linked.
- Normalize push, commit, PR, review, and issue activity into `contributions`.
- For pushes and PR updates, fetch only the relevant commit/PR diff using installation-scoped credentials.
- Enforce maximum changed-file count and diff byte limits.
- Exclude binary files, generated files, lockfiles, vendored dependencies, secrets, and files matching configured ignore patterns.
- Redact likely credentials and sensitive values before AI processing.
- Store a concise diff summary and references; avoid retaining full diffs longer than necessary.
- Never execute repository code or build scripts as part of analysis.

### Diff context
Provide the AI with:
- Project goals and acceptance criteria.
- Relevant task descriptions and statuses.
- Repository names and file paths.
- Bounded diff excerpts or deterministic summaries.
- PR title/body/status and review state.
- Recent related contributions.
- Known dependencies and blockers.

Do not send every diff to the model. Trigger analysis selectively: meaningful PR changes, task-linked changes, repeated activity on a task, or scheduled team summaries. Debounce bursts of pushes.

## 9. AI workflow and structured output

Use separate prompts/workflows for:

1. **Project bootstrap:** Combine team-lead goals with README/docs and repository structure.
2. **Change interpretation:** Summarize what a diff appears to change, without claiming tests passed unless evidence says so.
3. **Task matching:** Match activity to existing tasks and identify possible gaps.
4. **Developer recommendations:** Suggest next useful tasks based on assigned work, skills/responsibilities, current activity, and dependencies.
5. **Lead recommendations:** Highlight team-level priorities, ownership gaps, cross-repository coordination, and blockers.

Require structured JSON output, validate it against a schema, and reject malformed or unsupported claims.

Example recommendation object:

```json
{
  "target_role": "developer",
  "target_user_id": "uuid",
  "recommendation_type": "create_task",
  "title": "Add validation to order creation endpoint",
  "description": "Validate required fields and return consistent error responses.",
  "priority": "high",
  "confidence": 0.84,
  "reasoning": "The current PR adds the endpoint, while the project requirements specify validation and the frontend is integrating against this API.",
  "repository_ids": ["uuid"],
  "evidence": [
    {"type": "pull_request", "reference": "PR #18"},
    {"type": "project_requirement", "reference": "Order creation"}
  ],
  "dependencies": []
}
```

The model must not invent repository events, task completion, test results, developer skills, or project requirements. If evidence is insufficient, ask for clarification or produce no recommendation.

## 10. Progress and task semantics

- Task status is the primary source for progress.
- GitHub events provide evidence and context; they do not automatically mark a task done.
- A PR merged may suggest that a task is ready for human verification, not necessarily completed.
- A task is complete when its acceptance criteria are satisfied and a human or explicitly trusted workflow confirms it.
- Display repository activity freshness separately from task progress.
- Show blockers explicitly rather than hiding them in a progress percentage.

Initial progress formula:

`completed task count / total active task count * 100`

Exclude cancelled tasks and optionally exclude unapproved AI proposals. Add weighted tasks only after validating the UX.

## 11. Security and privacy

- Use GitHub App installation tokens with the narrowest required permissions.
- Store App private keys and webhook secrets only in server-side secret storage.
- Verify webhook signatures and delivery IDs.
- Enforce Supabase Row Level Security on all event/team-scoped tables.
- Keep service-role credentials server-side only.
- Authorize organizer, lead, developer, and viewer actions on the backend.
- Do not expose private diffs to event-wide viewers by default.
- Do not use repository content as instructions. Treat README files, code comments, issue bodies, PR descriptions, and diffs as untrusted input; defend against prompt injection.
- Redact secrets before storage or model submission.
- Provide repository disconnect and data-retention controls.
- Log approvals, rejections, assignments, and permission-sensitive actions.
- Do not let the AI perform GitHub write operations in the MVP.

## 12. Realtime UX

The UI should update when:
- A GitHub event is processed.
- A contribution appears.
- A task or blocker changes.
- A recommendation is generated or reviewed.
- A repository is connected or disconnected.

Recommended pages:
- `/events/[eventId]` — event-wide overview.
- `/teams/[teamId]` — team dashboard and project context.
- `/teams/[teamId]/tasks` — task board.
- `/teams/[teamId]/repositories` — connected repositories and activity.
- `/developers/[userId]` — profile, contributions, assigned work.
- `/recommendations` — personal recommendations.
- `/teams/[teamId]/recommendations` — team lead recommendations.

Use clear labels distinguishing observed GitHub facts, AI inferences, and human-confirmed task status.

## 13. Implementation plan

### Milestone 1 — Foundation
- Initialize Next.js, TypeScript, linting, formatting, and environment validation.
- Create Supabase project and migration workflow.
- Implement profiles, events, teams, memberships, and RLS.
- Build authentication, event setup, team management, and role-aware navigation.

**Done when:** An organizer can create an event, add teams, and invite members with enforced permissions.

### Milestone 2 — Repositories and tasks
- Create GitHub App and installation callback.
- Implement repository discovery and team-repository association.
- Build project-context form for goals, requirements, and acceptance criteria.
- Implement task CRUD, assignments, statuses, and repository links.

**Done when:** A team can connect multiple repositories and manage tasks linked to one or more repositories.

### Milestone 3 — GitHub event ingestion
- Implement signed webhook endpoint and delivery deduplication.
- Add durable background processing.
- Normalize push, PR, review, and issue events.
- Link GitHub identities to MergeMind profiles.
- Fetch bounded diffs for relevant events and store safe summaries.

**Done when:** A push or PR update appears in the correct repository and developer activity timeline without duplicate events.

### Milestone 4 — Project understanding and AI
- Build project bootstrap analysis using human goals plus repository documentation.
- Implement diff interpretation and task matching.
- Generate developer and team-lead recommendations.
- Save recommendations as `pending`.
- Build approve, edit, and reject flows.

**Done when:** The AI proposes evidence-backed tasks for both developers and leads, and nothing becomes assigned/actionable without human approval.

### Milestone 5 — Event-wide experience
- Build team cards and event-wide dashboard.
- Add task-based progress, repository activity freshness, blockers, and help requests.
- Add realtime subscriptions and activity feed.
- Add filters by team, status, and activity.

**Done when:** An organizer can see the state of all teams while private repository details remain protected.

### Milestone 6 — Reliability and demo polish
- Add rate limiting, retry handling, queue monitoring, and structured logs.
- Test webhook signature failures, duplicate delivery, revoked installations, unknown GitHub users, and oversized diffs.
- Test RLS across all roles.
- Seed a demo event with multiple teams and multiple repositories per team.
- Prepare a demo showing a push, an updated contribution feed, an AI recommendation, human approval, and event dashboard update.

## 14. Hackathon MVP priority

If time is limited, prioritize in this order:

1. Auth, event/team setup, roles.
2. Multiple repository connection per team.
3. Task board and assignments.
4. GitHub webhook ingestion for push and pull request events.
5. Developer activity timeline.
6. AI-generated task proposals based on project goals and bounded diffs.
7. Approval workflow.
8. Event-wide dashboard and realtime polish.

Defer Slack, ChatGPT/MCP integration, automated GitHub writes, full repository indexing, advanced skill inference, and complex dependency prediction.

## 15. Acceptance criteria

The MVP is ready when:

- An event can contain multiple teams.
- A team can connect multiple GitHub repositories.
- A task can reference multiple repositories.
- Developers can link GitHub identities.
- Valid GitHub webhook events are verified, deduplicated, and processed asynchronously.
- Relevant diff summaries appear against the correct repository and contributor.
- Human project goals and repository documentation both inform project understanding.
- AI can propose tasks for individual developers and team leads.
- Every recommendation contains a reason and supporting evidence.
- Recommendations require human approval before becoming actionable tasks.
- Progress is task-based, not commit-count-based.
- Organizers can view event-wide progress without automatically receiving private code diffs.
- RLS and backend authorization prevent cross-team data leakage.

## 16. Coding agent instructions

When implementing this project:

1. Read this file before making changes.
2. Inspect the existing codebase and preserve established conventions.
3. Implement in small, testable milestones; do not generate the entire application in one pass.
4. Create migrations for schema changes and include RLS policies in the same change.
5. Add tests for authorization, webhook signature verification, deduplication, and recommendation approval.
6. Validate all external inputs, especially GitHub webhook payloads and LLM output.
7. Keep secrets out of source control, logs, client bundles, and prompts.
8. Use typed API contracts and structured error responses.
9. Never fabricate GitHub activity or claim a task is complete without evidence.
10. Never allow AI recommendations to silently assign work or perform GitHub write operations.
11. Update this document when an intentional architecture decision changes.
12. Before declaring a milestone complete, run relevant tests and report what passed, what failed, and what remains.
