# Spec: Card submissions and catalog review

## Objective and accepted behavior

Signed-in users submit missing cards at `/card-requests/new`, reached from
Current Cards and the public catalog. Name, issuer, official HTTPS URL, and at
least one existing catalog filter tag are required. Optional grouped fields cover
fees, network, secured status, credit requirements, reward type/value/category
rates/caps, offers, ordered benefits, description, and notes. Unknown values stay
unknown rather than becoming zero or false. Reward categories are distinct from
catalog filter tags. No card/account numbers, uploads, new tags, or notification
email collection. Historical notification emails remain stored.

`/account/card-requests` shows owner-scoped history, decision notes, and catalog
anchors for accepted cards. No email delivery or user edits after submission.

Admins in `app_admins` use `/admin/card-requests` for status filters, issuer/name
search, and 25-row pages, with pending requests oldest first. Individual review
pages preserve original submissions and save private incomplete drafts. Accept
and publish requires official-source verification, annual fee, reward type,
applicable rates and point value, tags, name, issuer, source URL, secured status,
and first-year waiver status. Other details remain optional. Published cards are
active and verified. Admins can instead accept by linking an existing active,
verified card without modifying it, or deny with a public decision note.
Decisions are final in this workflow. Acceptance does not add to Current Cards.

## Boundaries and data contracts

`CardDetails` and `RequestResult` define validated input and structured action
results. `submitCardRequest` creates server-controlled pending requests;
`reviewCardRequest` accepts save/publish/link/deny operations and a revision.
Existing database status values are retained and labeled Pending/Accepted/Denied.
Legacy reward selections remain separate from filter tags. Historical accepted
requests without a catalog link are not automatically published.

Original structured details live on `card_requests`; private editable drafts live
in `card_request_drafts`. Browser roles have no mutation grants. Owner reads use
RLS; drafts require admin access. Server actions authenticate and authorize before
using the existing server-only service-role client. Review RPC execution is
restricted to service_role and checks actor membership, locks the request, and
checks pending state and revision. Publication, related rows, and review metadata
commit atomically. Equal normalized issuer/name publications are serialized to
prevent duplicate inserts. Repeated or stale decisions return conflicts.

Inputs are allowlisted, bounded, and server-validated. User URLs are never
fetched. Source verification is a human responsibility. Application validation
uses existing catalog enum, numeric, and foreign-key constraints. User-facing
errors never expose database details. React renders user text escaped.

## Verification and rollout

Unit tests cover parsing, publication requirements, action authorization, and
errors. Component tests cover submission, drafts, history, and queue navigation;
Playwright covers the authenticated workflow and database permission boundaries.

Run `npm run verify`, `npm run build`, `npm run test:e2e`, and `git diff --check`
on Node 24/npm 11 with local Supabase. Review the additive migration before
application; do not reset or migrate any environment without explicit approval.
Deploy schema before the application through the protected production workflow.
Revert the application for rollback; retain additive data and privileges and use
a reviewed forward fix rather than reverting to the insecure old write grants.
