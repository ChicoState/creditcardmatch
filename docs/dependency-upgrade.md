# Dependency upgrade compatibility report

## Scope and acceptance

**Status: Complete locally; accepted by the user. Changes remain uncommitted.**

Upgrade project npm dependencies to current stable compatible releases while preserving
Node 24/npm 11, the existing application behavior, database schema, and security fixes.
Use the isolated dependency-upgrade worktree for verification, then transfer only
verified upgrade changes back to the working checkout. No remote migrations or
deployments are part of this task.

Acceptance: clean lockfile installation; a valid peer dependency tree; formatting,
lint, type checks, unit/component tests and coverage; production build; Docker smoke
checks; existing browser flows against local Supabase; and dependency audit.

## Direct dependency changes

| Package                       | Before               | Target                               |
| ----------------------------- | -------------------- | ------------------------------------ |
| `@supabase/supabase-js`       | `^2.116.0`           | `^2.119.2`                           |
| `next`                        | `^16.4.1`            | `^16.4.6`                            |
| `react`                       | `^19.3.0`            | `^19.3.1`                            |
| `react-dom`                   | `^19.3.0`            | `^19.3.1`                            |
| `@playwright/test`            | `^1.63.0`            | `^1.65.1`                            |
| `@testing-library/jest-dom`   | `^7.0.1`             | `^8.0.0`                             |
| `@testing-library/user-event` | `^14.6.7`            | `^14.6.13`                           |
| `@types/node`                 | `^22.20.3`           | `^24.19.2`                           |
| `typescript-native`           | `New compiler alias` | `npm:typescript@^7.0.2`              |
| `@vitest/coverage-v8`         | `^5.0.1`             | `^5.1.1`                             |
| `eslint-config-next`          | `^16.4.1`            | `^16.4.6`                            |
| `jsdom`                       | `^30.0.1`            | `^31.0.1`                            |
| `prettier`                    | `^3.9.7`             | `^3.10.1`                            |
| `supabase`                    | `2.117.0`            | `3.2.0`                              |
| `typescript`                  | `^6.0.3`             | `npm:@typescript/typescript6@^6.0.2` |
| `vitest`                      | `^5.0.1`             | `^5.1.1`                             |

## Compatibility decisions

- Keep ESLint 9.39.5: the latest `eslint-plugin-react` peer range stops at ESLint 9.
  Do not force an unsupported ESLint 10 installation or disable lint checks.
- Align `@types/node` with the supported Node 24 runtime rather than Node 26.
- Use Microsoft's documented side-by-side setup: TypeScript 7 supplies the compiler for
  `npm run typecheck`, while `typescript` resolves to the TypeScript 6 compatibility
  API required by typescript-eslint. The alias is named `typescript-native` to
  avoid the optional `@typescript/native` preview peer requested by the parser.
  The typecheck script invokes the native package explicitly because both compiler
  packages expose a `tsc` binary. Next.js CLI build checking resolves the
  compatibility package's compiler. Both checking paths must pass; neither is skipped.
- Enable the Next.js CLI checker and retain the 3 MB Server Action limit.
  Set the previously requested security upgrade-reminder policy explicitly.
- Supabase CLI 3 defaults database commands to local. The protected release
  migration command uses `--yes --remote="$SUPABASE_DB_URL"`; the production
  npm script uses `--remote`. Keep protected-environment approval and secret checks.
  Those remote commands are inspected, not executed during this upgrade.
- Keep the CLI exactly pinned, preserve caret ranges for other direct dependencies,
  and update compatible transitive dependencies in the lockfile.
- Retain already-current dependencies, including Sharp, the Supabase SSR package,
  React type packages, and React Testing Library.

## Verification

All applicable local compatibility checks passed in the upgrade worktree:

- Clean `npm ci` installation and `npm ls --all` passed without an invalid
  peer tree. No forced or legacy peer dependency resolution was used.
- `npm run verify` passed formatting, lint, native TypeScript 7 checks, 247
  unit/component tests, coverage thresholds, and Docker smoke checks with cleanup.
- The 13 opt-in survey transaction tests passed separately against their
  automatically removed disposable database; the ordinary unit run skips them.
- The production build and all 24 Playwright browser tests passed against the
  existing local Supabase stack, using the Playwright 1.65.1 browser installation.
- The full npm audit reports zero vulnerabilities, including development packages.
- Supabase CLI 3.2.0 reports the existing configuration as valid. It warns about
  the existing `auth.email.enable_signup` and `auth.sms.enable_signup` aliases;
  these remain supported in CLI 3. Provider behavior and database schema were
  preserved. After automated verification, the user reported running
  `npm run supabase:start` and `npm run supabase:reset` and accepted this portion
  as complete. This is user-reported manual coverage of the upgraded CLI;
  command logs were not independently inspected. Remote deployment remains
  unverified.
- The Next.js 16.4.6 update also includes the earlier security-only upgrade's
  version/configuration changes. That historical local branch was not merged.

Two test compatibility repairs were needed. jsdom 31 preserves the input text
`425.50`, so the survey display assertion now expects that entered value while
retaining the exact stored-number assertion. The opt-in Docker/psql suite uses
an explicit 30-second test timeout; its multi-process round-trip test exceeded
Vitest's five-second unit-test default under build load. Assertions and SQL
statement timeouts were not weakened.

Repeated browser runs exhausted the existing local 15-minute authentication
rate-limit window. After it expired, all 24 tests passed without changing the
limiter or test assertions.

The existing Vitest/Vite config warning about a future native config-loader
default remains informational. It does not affect the current verification.

```bash
npm ci
npm ls --all
npm run verify
NODE_ENV=production npm run build
CI=1 NODE_ENV=production npm run test:e2e
npm run security:audit
npm run security:audit:all
```

## Sources

- [TypeScript 7 side-by-side compatibility setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60)
- Next.js installed docs: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md`
- [Supabase CLI 3 migration guide](https://supabase.com/docs/guides/local-development/cli/migrating-to-v3)
- [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [jest-dom 8 release notes](https://github.com/testing-library/jest-dom/releases/tag/v8.0.0)
- npm registry metadata and peer dependencies for the installed package versions.
