# Implementation Plan: Preliminary Site Shell

## Overview

Bootstrap the smallest accessible Next.js UI that proves the local development path works.

## Task List

### Task 1: Add a behavior test for the tab shell

- Acceptance: the expected tab labels and selected-panel content are asserted.
- Verify: the test fails before the page exists, then passes after implementation.
- Files: `tests/app/home-page.test.tsx`.

### Task 2: Add the root layout and page

- Acceptance: the root route renders an accessible, responsive tab interface with empty panels.
- Verify: `npm run test`, `npm run lint`, and `npm run typecheck`.
- Files: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.

### Task 3: Enable the development entrypoint and document it

- Acceptance: Compose starts `npm run dev` and the README gives exact local commands.
- Verify: `docker compose config`, `npm run build`, and a local browser request.
- Files: `compose.yml`, `README.md`.

### Checkpoint: Complete

- The application test, coverage, lint, type-check, and build commands pass in the Node 24 container.
- The page is visible at `http://localhost:3000`.

## Risks and Mitigations

| Risk                                 | Mitigation                                                             |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Host Node is unsupported             | Use the documented Node 24 Docker environment.                         |
| Browser automation is not configured | Verify with a local HTTP request and report browser-tool availability. |
