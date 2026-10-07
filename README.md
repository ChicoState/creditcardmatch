# Credit Card Match

Infrastructure foundation, Phase 1 MVP pages and pure matching logic, and Phase 2a Supabase-backed catalog reads, fictional seed data, and Playwright coverage for a credit-card matching web application. Landing, Survey, Results, Learn, Login, and Signup routes exist. Authentication and saving remain Phase 2b work. The Supabase schema migrations are verified on the local stack; pending team review, and they have not been applied to a remote Supabase environment.

The stack is TypeScript, Next.js/React, Supabase, npm, and a Node 24 development container. Every developer also installs Node 24 LTS and npm 11 on the host so the project-pinned Supabase CLI can manage Docker through `npx`. Update the exact container image patch and `.nvmrc` together when the project deliberately refreshes its LTS baseline.

## Repository map

| Location                    | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `app/`                      | Next.js App Router pages for the Phase 1 MVP.                    |
| `components/`, `lib/`       | UI components, configuration seams, pure logic, and data access. |
| `supabase/migrations/`      | Versioned migrations verified locally; pending team review.      |
| `tests/`                    | Infrastructure, application, and pure-logic Vitest coverage.     |
| `tests/e2e/`                | Playwright flows against the local Supabase stack.               |
| `scripts/`                  | Reproducible infrastructure smoke checks.                        |
| `Dockerfile`, `compose.yml` | Node 24 development environment.                                 |
| `.github/workflows/`        | Pull-request checks and protected release workflow.              |
| `.agents/skills/`           | Project engineering workflows for humans and agents.             |
| `infrastructure_plan.md`    | Accepted infrastructure decisions and source of truth.           |
| `docs/data-model-plan.md`   | Planned MVP data model, access rules, and open decisions.        |

## Getting Started

### Prerequisites

Install these tools on every development machine:

- [Git](https://git-scm.com/downloads).
- [Node.js 24 LTS](https://nodejs.org/en/download), including npm 11. Do not install Node only inside a container; the Supabase CLI must run on the Docker host.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker Compose.
- A current Chrome, Edge, Firefox, or Safari browser.

On **Windows**, use the official Node.js 24 LTS installer and Docker Desktop for Windows, then run commands from PowerShell in the repository directory. On **macOS**, use the official Node.js 24 LTS installer and Docker Desktop for Mac, then run commands from Terminal. Supabase's [CLI installation guide](https://supabase.com/docs/guides/local-development/cli/getting-started) explicitly supports installing the CLI as an npm project dependency on Windows and invoking it with `npx`; the Windows steps in this README follow that guide but are **untested in this repository**. The macOS steps were verified on the project's Intel Mac.

Verify the host tools:

```sh
git --version
node --version
npm --version
docker --version
docker compose version
```

`node --version` must report `v24.x`; this repository expects npm 11.x. Start Docker Desktop before continuing.

### Install and configure

1. Install the locked dependencies on the host from the repository root:

   ```sh
   npm install
   ```

   The host `node_modules` directory does not interfere with the app container. `compose.yml` mounts a Docker named volume at `/workspace/node_modules`, which masks the host directory inside that container.

2. Start the local Supabase stack from the **host**, not from the app container:

   ```sh
   npm run supabase:start
   npx supabase status
   ```

   The first start pulls the local service images. The npm script runs the pinned `supabase@2.117.0` CLI through `npx`; do not add a helper container, mount `docker.sock`, or run this CLI inside Compose.

3. Create an ignored `.env.local` file and copy the local URL and keys printed by `npx supabase status` into it. On macOS:

   ```sh
   cp .env.example .env.local
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Set `NEXT_PUBLIC_SUPABASE_URL` to the local API URL and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the local anonymous/publishable key. Add a local server-only key only when a future server feature needs it. Local URLs and keys belong in `.env.local` only; never put them in a tracked file or commit `.env.local`.

4. Start the app separately in Docker:

   ```sh
   npm run docker:up
   ```

   Open [http://localhost:3000](http://localhost:3000). The app container is controlled by `compose.yml`; the host CLI independently controls the Supabase containers. Both sets run side by side through Docker Desktop, and the browser reaches their published host ports. The application reads its fictional catalog from the local Supabase Data API.

5. To discard local database changes, reapply all migrations, and load `supabase/seed.sql`:

   ```sh
   npm run supabase:reset
   ```

6. Run the application checks:

   ```sh
   docker compose run --rm --no-deps app npm run test
   docker compose run --rm --no-deps app npm run coverage
   docker compose run --rm --no-deps app npm run lint
   docker compose run --rm --no-deps app npm run typecheck
   ```

   With the local Supabase stack running and Playwright Chromium installed, run
   the browser suite from the host. Playwright starts Next.js on port 3001 when
   no server is already available there:

   ```sh
   npm run test:e2e
   ```

   To confirm production compilation, run:

   ```sh
   docker compose run --rm --no-deps app npm run build
   ```

7. Stop both independently managed stacks when finished:

   ```sh
   npm run docker:down
   npm run supabase:stop
   ```

   `docker:down` removes the app's named dependency and build volumes. `supabase:stop` stops the local Supabase services while preserving their local data for the next start.

## Commands

| Command                                     | Current scope                                                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                    | Reproducible dependency install with Node 24/npm 11.                                                                              |
| `npm run format:check`, `lint`, `typecheck` | Static tooling checks.                                                                                                            |
| `npm run test`, `coverage`                  | Infrastructure, application-page, and pure matching-logic tests.                                                                  |
| `npm run verify`                            | Full repository baseline. It currently reports pre-existing formatting drift in repository-managed skill and configuration files. |
| `npm run test:e2e`                          | Runs catalog, survey, and filter flows in Chromium against the local Supabase stack.                                              |
| `npm run test:smoke`                        | Builds and checks the Docker-based development foundation.                                                                        |
| `npm run build`, `dev`, `start`             | Next.js production build, development server, and production server commands. Use Node 24 or Docker.                              |
| `npm run supabase:start`                    | Starts the local Supabase stack from the host with the pinned CLI.                                                                |
| `npm run supabase:reset`                    | Recreates the local database and reapplies migrations.                                                                            |
| `npm run supabase:stop`                     | Stops the local Supabase stack without contacting a remote project.                                                               |
| `npm run db:migrate:production`             | Protected release-only Supabase command; never run against production from a workstation.                                         |

## GitHub configuration

Before enabling protected release deployment, create the `production` GitHub Environment with approval rules. Add `VERCEL_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `E2E_TEST_USER_EMAIL`, and `E2E_TEST_USER_PASSWORD` as secrets; set `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `E2E_BASE_URL`, and `PRODUCTION_SMOKE_URL` (the future health endpoint) as variables. Create separate Supabase development, test, and production projects; never reuse production values locally.

The release workflow intentionally fails its prerequisite check until Vercel values are configured. Playwright is skipped on pull requests until the dedicated non-production test environment is configured; make that check required once its secrets are available. Dependabot must be enabled in the GitHub repository settings.

## Troubleshooting

- **Engine warnings or Supabase CLI failure:** verify the host reports Node 24.x and npm 11.x, then rerun `npm install` on the host.
- **Supabase cannot start:** start Docker Desktop and confirm `docker info` succeeds. The local CLI needs direct access to the host Docker daemon.
- **Local Supabase values are missing:** run `npx supabase status` and copy its local API URL and keys to ignored `.env.local` only.
- **Docker cannot pull `node:24.21.0-bookworm-slim`:** restore Docker daemon DNS/network access, then rerun `docker compose build app`.
- **Port 3000 or a Supabase port is busy:** stop the other local process or stack before restarting this project.
