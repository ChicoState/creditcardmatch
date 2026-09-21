# Infrastructure Plan

> Planning only. This document describes future infrastructure work. No installations, configuration changes, containers, workflows, deployments, or other implementation files were created by the infrastructure-planning process.

## 1. Project and User Experience

- **Application:** Personal, single-user web application.
- **Primary users:** Individual signed-in users.
- **Primary user task:** Use personal application data from any of their devices.
- **Selected platform:** Full-stack browser application.
- **User-experience rationale:** Browser access requires no application installation while accounts make each user's data available across devices.
- **Required operating systems, browsers, or devices:** Current desktop and mobile versions of major evergreen browsers.
- **Offline or native-device requirements:** None confirmed; online access is required for account-backed data.

## 2. Connectivity and Application Shape

- **Connectivity model:** Single-user web-enabled.
- **Accounts and authentication:** Supabase Auth manages individual accounts and sessions.
- **Backend required:** Yes; Next.js server features access protected data and external services.
- **Cross-device persistence:** Hosted PostgreSQL stores each user's data under row-level access rules.
- **Interaction between accounts:** None; users do not share or collaborate on data.
- **Primary application components:** Next.js/React browser interface, Next.js server routes or server actions, Supabase Auth, and Supabase PostgreSQL.

## 3. Selected Technology Stack

| Area | Selected technology | Purpose | Version policy |
|---|---|---|---|
| Primary language | TypeScript | Typed client and server application code | Current supported TypeScript compatible with Next.js |
| Application framework | Next.js with React | Full-stack browser UI and server features | Current supported stable release |
| Runtime or SDK | Node.js | Runs development tooling and Next.js | Active or maintenance LTS |
| Package manager | npm | Installs and locks JavaScript dependencies | Version bundled with selected Node.js LTS |
| Build tool | Next.js build system | Produces the deployable web application | Framework-managed |
| Backend framework | Next.js Route Handlers and Server Actions | Authenticated server-side operations | Framework-managed |
| Data and auth platform | Supabase | Hosted PostgreSQL, authentication, and access controls | Current compatible hosted service/API |

## 4. Storage and Persistence

- **Storage model:** Hosted relational storage.
- **Primary data store:** Supabase-hosted PostgreSQL.
- **User files or object storage:** None planned; add Supabase Storage later only if users must upload files or media.
- **Local-development storage:** A separate Supabase development project; do not use production credentials locally.
- **Production hosting model:** Supabase managed PostgreSQL in a production project.
- **Schema and migration approach:** Version-controlled SQL migrations applied through the future Supabase migration workflow.
- **Backup, export, or recovery approach:** Use the provider's managed backups; document an application-level user-data export before release if users need it.
- **Secrets and connection-string approach:** Store server-only Supabase credentials in local environment files excluded from Git and in Vercel/GitHub secrets; expose only the permitted public URL and anonymous key to the browser.
- **Reason this storage fits the access pattern:** PostgreSQL provides durable structured data across devices, while Supabase combines it with managed authentication and row-level authorization.

## 5. Testing Tools

| Test layer | Tool or library | Planned scope | Planned execution point |
|---|---|---|---|
| Unit | Vitest | Pure application logic and utility modules | Local and pull requests |
| Component | React Testing Library with Vitest | Accessible UI behavior and component states | Local and pull requests |
| Integration | Vitest with mocked Supabase boundaries; a dedicated test Supabase project when database behavior is required | Server-side data and authorization behavior | Local and pull requests |
| End-to-end | Playwright | Sign-in and highest-value personal-data workflows | Pull requests and release validation |

## 6. Test Analysis

| Capability | Tool | Planned policy |
|---|---|---|
| Coverage | Vitest V8 coverage | Produce LCOV and text reports on pull requests |
| Coverage threshold or regression rule | Vitest coverage thresholds | Block merges when tested application code falls below an initial 80% line/function baseline; adjust deliberately as the project matures |
| Mutation testing | Not selected | Reconsider only for small, critical calculation or matching modules in a scheduled workflow |
| Reporting | GitHub Actions artifacts | Upload coverage output on failures and when useful for review |

## 7. Static Analysis and Security

| Check | Tool | Planned enforcement |
|---|---|---|
| Formatting | Prettier | Verify on every pull request |
| Linting | ESLint with Next.js rules | Block pull requests on errors |
| Type checking | TypeScript compiler (`tsc --noEmit`) | Block pull requests on errors |
| Dependency vulnerability scanning | Dependabot and npm audit in CI | Dependabot opens updates; high-severity audit findings block when actionable |
| Secret scanning | Gitleaks | Block pull requests and scan history as appropriate |
| Static security analysis | GitHub CodeQL for JavaScript/TypeScript | Run on pull requests and on a schedule; block confirmed actionable findings |

## 8. Development Technologies Requiring Manual Installation

These are developer-workstation prerequisites that will not be supplied by the planned Docker environment.

| Technology | Why it is needed | Required on which machines | Version policy | Planned installation or verification method | Why Docker does not provide it |
|---|---|---|---|---|---|
| Git | Source control and GitHub workflow | Every developer workstation | Current supported release | Future setup documentation: `git --version` | Host credentials and repository access belong on the workstation |
| Docker Desktop or Docker Engine with Compose | Runs the reproducible development container | Every developer workstation | Current supported release | Future setup documentation: `docker --version` and `docker compose version` | The host must provide the Docker daemon/container runtime |
| Supported browser | Manual exploratory testing and Playwright browser launch support | Every developer workstation | Current stable browser | Future setup documentation: install current Chrome, Edge, Firefox, or equivalent | A development container cannot supply a user's native browser experience |

### Host tools intentionally not required

- **Not required because Docker supplies them:** Node.js, npm, application dependencies, and project-local build tooling.
- **Not required for this platform:** Native mobile SDKs, desktop packaging SDKs, database server installation, and production container tooling.

## 9. Docker Plan

- **Planned Docker role:** Reproducible development environment only.
- **Future files that would be created during implementation:** Development `Dockerfile`, `compose.yml`, `.dockerignore`, and an example environment-variable template.
- **Planned images and services:** One Node.js development image for the Next.js application; Supabase remains a managed remote development service.
- **Development container behavior:** Bind-mount the working tree, retain dependencies in a named volume, and run the Next.js development server as a non-root user where practical.
- **Ports:** Publish the Next.js development port only to the developer workstation.
- **Bind mounts and named volumes:** Bind mount source files for live reload; use a named volume for `node_modules`.
- **Environment-variable and secret handling:** Read developer-specific values from an ignored local environment file; never bake secrets into the image.
- **Local database or service containers:** None planned.
- **Production image or non-container release path:** Vercel builds and deploys Next.js directly; no production Docker image is planned.
- **Build stages and hardening:** The development image should pin a supported Node.js LTS base, use a `.dockerignore`, and avoid embedded secrets; production-image hardening is out of scope because no image is released.
- **Planned future development command:** `docker compose up --build`.
- **Planned future production command:** Vercel deployment is performed by the future release workflow, not Docker.

## 10. GitHub Actions Plan

### A. Automated pull-request checks

- **Future workflow file:** `.github/workflows/pr-checks.yml`
- **Trigger:** `pull_request`.
- **Runner or matrix:** Ubuntu latest with the selected Node.js LTS; no operating-system matrix initially.
- **Permissions:** `contents: read` by default; grant only the minimum additional permissions required for CodeQL and checks reporting.
- **Planned jobs in order:**
  1. Checkout, set up Node.js LTS, restore npm cache, and install with `npm ci`.
  2. Verify Prettier formatting, run ESLint, and run TypeScript type checks.
  3. Run Vitest unit, component, and applicable integration tests with coverage thresholds.
  4. Build the Next.js application to validate production compilation.
  5. Run Gitleaks and CodeQL; run Playwright end-to-end tests against a dedicated test environment.
- **Service containers:** None; integration and end-to-end tests use a purpose-built Supabase test project with restricted credentials.
- **Caching:** Cache npm's package cache keyed by the lockfile and Node.js version; do not cache secret-bearing environment files.
- **Coverage and analysis reporting:** Upload coverage output; report CodeQL results through GitHub code scanning.
- **Failure artifacts:** Upload Playwright traces, screenshots, videos, test logs, and coverage reports on failed jobs.
- **Checks that should block merging:** Lockfile installation, formatting, linting, type checks, unit/component/integration tests, coverage threshold, build, Gitleaks, actionable CodeQL findings, and stable end-to-end tests.
- **Proposed branch-protection settings:** Require pull-request review, current branch before merging, and all blocking checks; restrict direct pushes to the protected default branch.

### B. New-release deployment

- **Future workflow file:** `.github/workflows/release.yml`
- **Release trigger:** A pushed, validated `v*` Git tag, with `workflow_dispatch` available for a controlled retry.
- **Release destination:** Vercel managed web hosting.
- **Runner or matrix:** Ubuntu latest with the selected Node.js LTS.
- **Planned jobs in order:**
  1. Checkout the tagged revision, restore dependencies with `npm ci`, and repeat formatting, lint, type-check, test, coverage, and build validation.
  2. Run the production deployment to the protected Vercel environment.
  3. Run a post-deployment smoke test against the deployment URL and publish release notes.
- **Build artifacts:** Vercel deployment metadata and optional test/coverage artifacts; no installer or container image.
- **Signing, notarization, or store requirements:** None for browser delivery.
- **Database migration step:** Apply reviewed Supabase migrations before application deployment when a release includes schema changes; use a separate protected migration step and least-privilege credential.
- **Environment approval:** Require approval for the production GitHub Environment before migration or deployment.
- **Post-deployment verification:** Check the deployed health page and an authenticated smoke-test workflow using a non-production test user.
- **Failed-release or rollback approach:** Revert to the prior Vercel deployment; if a migration is involved, use a pre-reviewed forward fix or a tested rollback migration before restoring the application version.

### GitHub configuration required later

| Name | Type | Purpose |
|---|---|---|
| `VERCEL_TOKEN` | Secret | Authenticates the release workflow to Vercel |
| `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` | Variables | Select the intended Vercel organization and project |
| `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Variables | Browser-safe configuration for the selected Supabase project/environment |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server-only administrative operations; never expose to browser code |
| `SUPABASE_DB_URL` or migration token | Secret | Authenticates the protected schema-migration job |
| `E2E_TEST_USER_EMAIL` and `E2E_TEST_USER_PASSWORD` | Secrets | Dedicated non-production account for Playwright |
| `production` | GitHub Environment | Holds deployment protection rules and production-scoped secrets |
| Supabase and Vercel accounts | Provider accounts | Host authentication/data and deploy releases |

## 11. Planned Repository Artifacts - Not Created by This Skill

- [ ] Application manifest or project file: `package.json`
- [ ] Lockfile: `package-lock.json`
- [ ] Test configuration: Vitest and Playwright configuration files
- [ ] Static-analysis configuration: Prettier, ESLint, TypeScript, Gitleaks, and CodeQL configuration as needed
- [ ] Docker or Compose files: Development `Dockerfile`, `compose.yml`, and `.dockerignore`
- [ ] `.github/workflows/pr-checks.yml`: Pull-request validation workflow
- [ ] `.github/workflows/release.yml`: Tagged-release deployment workflow
- [ ] Deployment or store configuration: Vercel project settings and Supabase project/environment configuration

## 12. Assumptions and Open Items

- **Assumptions:** The application needs structured, non-file data; it has no sharing between users, native-device requirements, or offline-first requirement.
- **Decisions still requiring an external account, credential, certificate, or organizational approval:** Create and fund/approve the Supabase and Vercel projects; create GitHub Environment protections and the listed secrets/variables.
- **Items to confirm before implementation begins:** Exact data model, required authentication providers, retention/export needs, supported-browser policy, initial coverage thresholds for generated versus application code, and the production domain.
