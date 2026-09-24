# Credit Card Match

Infrastructure foundation and preliminary site shell for a personal, account-backed credit-card matching web application. The root page provides empty Dashboard, My Cards, and Matches tabs; data models, authentication flows, Supabase migrations, and card-matching behavior have **not** been created yet.

The stack is TypeScript, Next.js/React, Supabase, npm, and a Node 24 development container. Node 24 is the current LTS line; update the exact image patch and `.nvmrc` together when the project deliberately refreshes its LTS baseline. Next.js requires Node 20.9 or newer.

## Repository map

| Location                    | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `app/`                      | Preliminary Next.js root layout and empty tabbed landing page. |
| `supabase/migrations/`      | Future reviewed SQL migrations — not created yet.              |
| `tests/infrastructure/`     | Infrastructure-only Vitest harness.                            |
| `tests/e2e/`                | Future Playwright tests — not created yet.                     |
| `scripts/`                  | Reproducible infrastructure smoke checks.                      |
| `Dockerfile`, `compose.yml` | Node 24 development environment.                               |
| `.github/workflows/`        | Pull-request checks and protected release workflow.            |
| `.agents/skills/`           | Project engineering workflows for humans and agents.           |
| `infrastructure_plan.md`    | Accepted infrastructure decisions and source of truth.         |

## Getting Started

1. Install current [Git](https://git-scm.com/downloads), [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose), and a current Chrome, Edge, Firefox, or Safari browser. Verify with:

   ```sh
   git --version
   docker --version
   docker compose version
   ```

2. Docker supplies Node/npm. If you elect to run tools on the host, install Node 24 LTS from [nodejs.org](https://nodejs.org/en/download) and verify `node --version` reports a `v24` release.

3. Copy the non-secret template and set development-project values only:

   ```sh
   cp .env.example .env
   ```

   `.env` is ignored. Never commit service-role keys, database URLs, or non-production test-user credentials.

4. Start the site in the development container after Docker can fetch the pinned image:

   ```sh
   docker compose up --build
   ```

   Then open [http://localhost:3000](http://localhost:3000). Leave this command running while you work; press `Ctrl+C` to stop it.

5. Run the preliminary-site checks in a second terminal:

   ```sh
   docker compose run --rm --no-deps app npm run test
   docker compose run --rm --no-deps app npm run coverage
   docker compose run --rm --no-deps app npm run lint
   docker compose run --rm --no-deps app npm run typecheck
   ```

   To confirm production compilation, run:

   ```sh
   docker compose run --rm --no-deps app npm run build
   ```

6. Clean up local containers and the named dependency volume:

   ```sh
   npm run docker:down
   ```

## Commands

| Command                                     | Current scope                                                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                    | Reproducible dependency install with Node 24/npm 11.                                                                              |
| `npm run format:check`, `lint`, `typecheck` | Static tooling checks.                                                                                                            |
| `npm run test`, `coverage`                  | Infrastructure harness now; application tests later.                                                                              |
| `npm run verify`                            | Full repository baseline. It currently reports pre-existing formatting drift in repository-managed skill and configuration files. |
| `npm run test:e2e`                          | Future Playwright suite; requires its test environment and credentials.                                                           |
| `npm run test:smoke`                        | Builds and checks the Docker-based development foundation.                                                                        |
| `npm run build`, `dev`, `start`             | Next.js production build, development server, and production server commands. Use Node 24 or Docker.                              |
| `npm run db:migrate:production`             | Protected release-only Supabase command; never run against production from a workstation.                                         |

## GitHub configuration

Before enabling protected release deployment, create the `production` GitHub Environment with approval rules. Add `VERCEL_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `E2E_TEST_USER_EMAIL`, and `E2E_TEST_USER_PASSWORD` as secrets; set `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `E2E_BASE_URL`, and `PRODUCTION_SMOKE_URL` (the future health endpoint) as variables. Create separate Supabase development, test, and production projects; never reuse production values locally.

The release workflow intentionally fails its prerequisite check until Vercel values are configured. Playwright is skipped on pull requests until the dedicated non-production test environment is configured; make that check required once its secrets are available. Dependabot must be enabled in the GitHub repository settings.

## Troubleshooting

- **Engine warnings or tool failure:** the host Node 18/npm 9 is unsupported. Use Node 24 or the Docker container.
- **Docker cannot pull `node:24.21.0-bookworm-slim`:** restore Docker daemon DNS/network access, then rerun `docker compose build app`.
- **Port 3000 is busy:** stop the other local process or change both the Compose port mapping and any future app configuration.
- **Supabase credentials are missing:** copy `.env.example` to `.env` and use only values from the separate development project.
