# Agent guidance

## Status and source of truth

This repository has infrastructure, Phase 1 MVP pages and pure matching logic, and a Phase 2a Supabase-backed fictional catalog with Playwright coverage. The Supabase schema migrations are verified on the local stack; pending team review. `infrastructure_plan.md` records the accepted stack and operational decisions; the files in this repository implement that plan. Authentication, saving, and their server handlers remain Phase 2b work. The migrations and seed have been confirmed to reset cleanly against the local CLI-managed Supabase stack, but have not been confirmed as applied to a remote Supabase environment.

Read `infrastructure_plan.md`, this file, and the applicable `.agents/skills/*/SKILL.md` before changing the project. Do not alter plan decisions during implementation; revise the plan through `infra-planner` first.

## Map

- Application UI/server source: `app/`, with reusable UI in `components/` and pure application modules in `lib/`.
- API: Next.js routes/server actions — not created yet.
- Database migrations: `supabase/migrations/` — verified on the local stack; pending team review. Do not apply without explicit authorization and protected workflow review.
- Infrastructure: `Dockerfile`, `compose.yml`, `.env.example`, `supabase/config.toml`, and tool config at root.
- Scripts and infrastructure tests: `scripts/`, `tests/infrastructure/`.
- Browser tests: `tests/e2e/` — Playwright coverage against the local Supabase stack.
- CI: `.github/workflows/pr-checks.yml` and `release.yml`.
- Documentation: `README.md`, `infrastructure_plan.md`, `docs/`, this file.
- Agent workflows: `.agents/skills/`.

## Skills

Use `infra-planner` before infrastructure decisions and `infra-builder` to implement them. Use `spec-driven-development` and `planning-and-task-breakdown` before significant application work; `frontend-ui-engineering` for UI; `api-and-interface-design` for public boundaries; `test-driven-development` and `test-in-browser` for behavior; `security-and-hardening` for auth, input, storage, or external calls; `documentation-and-adrs` for durable decisions; `code-review-and-quality` before merge; `ci-cd-and-automation` for workflows; and `git-workflow-and-versioning` for every change.

## Boundaries

Infrastructure work must not create product behavior or production data. Never commit `.env`, credentials, generated reports, dependencies, or build artifacts. Do not run migrations, deployments, publishing, or release commands against remote environments without explicit authorization and the protected workflow.

## Verification and lifecycle

Every developer runs Node 24/npm 11 and Docker Desktop on the host. Run the pinned Supabase CLI only from the host through `npm run supabase:start`, `npm run supabase:reset`, and `npm run supabase:stop`; never run it in the app container or add a Docker-socket helper. Keep local status URLs and keys in ignored `.env.local` only.

The normal Node 24 checks are `npm ci`, `npm run verify`, and (after app bootstrap) `npm run build` and `npm run test:e2e`. Pull-request CI is the equivalent quality baseline. Use `npm run docker:down` after Docker smoke checks; it removes the local named dependency volume. Stop the local Supabase stack separately with `npm run supabase:stop`.

Before a change: read the plan and relevant skill. After a change: run the applicable checks, inspect `git diff --check`, check for secrets, update documentation when commands, architecture, or workflows change, and report any unavailable prerequisite rather than marking it verified.
