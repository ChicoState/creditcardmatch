# Card request implementation plan

Accepted behavior: [card-request-spec.md](card-request-spec.md).

1. Define typed structured card details and failing validation tests; implement
   parsing with separate submission, draft, and publication requirements.
2. Add migration for original details, private drafts, revision checks, decision
   notes, and catalog links. Revoke browser mutation grants and add restricted
   atomic publication/review. Preserve legacy requests without publication.
3. Implement authenticated submission and owner history; replace the inline form
   with the dedicated entry point. Verify validation and access boundaries.
4. Implement admin queue, drafts, source verification, accept/publish, link
   existing, and denial. Verify stale updates and transaction behavior.
5. Run unit/component checks, browser tests against the reviewed local migration,
   production build, diff/secret review. Record unavailable prerequisites.

Migration application and remote deployment require separate authorization.

## Recovery checkpoint — 2026-11-18

Steps 1–4 are implemented in the working tree. The local database already has
the publication migration; recovery did not apply or reset any database.

Recovery fixed review-summary rendering for stored submissions that omit optional
reward/benefit collections and added a regression test. The local card-request
browser fixture now uses its own authentication quota for repeatable reruns.

Validation: formatting, lint, TypeScript, production build, and all 178
unit/component tests pass (use `--maxWorkers=2` on this host to avoid worker
startup timeouts). Configured coverage thresholds pass. The complete card-request
Chromium workflow passes against both development and a fresh production server,
including database permissions, private drafts, publication, linking, denial,
rollback, and stale revisions. The other 23 browser tests passed on the first
regression run; subsequent repeated runs hit the existing shared authentication
quota in account/auth tests. Stop and restart production servers after rebuilding
so they load the matching build artifacts.

The final full browser rerun reported 21 passed, two shared-quota failures in
account/auth, and one dependent test skipped. Dependency installation also
reported three high and eleven moderate audit findings in the existing lockfile;
dependency remediation is outside this feature's changes.

Host validation used Node 24 with existing dependencies and npm 12; the Docker
smoke workflow passed with a clean lockfile install, static checks, and all 178
tests on Node 24/npm 11, then removed its temporary volumes. Remote migration and
deployment remain unperformed and require the protected workflow and review.
