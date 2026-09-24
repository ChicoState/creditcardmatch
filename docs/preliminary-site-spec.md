# Spec: Preliminary Site Shell

## Objective

Provide a local, viewable starting page for Credit Card Match. A visitor can switch between empty Dashboard, My Cards, and Matches tabs to confirm that the application is running. This is a UI shell only: it does not authenticate users, store data, or perform card matching.

## Commands

- Development: `docker compose up --build`
- Tests: `docker compose run --rm --no-deps app npm run test`
- Coverage: `docker compose run --rm --no-deps app npm run coverage`
- Static checks: `docker compose run --rm --no-deps app npm run lint` and `docker compose run --rm --no-deps app npm run typecheck`
- Production compilation: `docker compose run --rm --no-deps app npm run build`
- Cleanup: `npm run docker:down`

## Project Structure

- `app/` contains the Next.js root layout, home page, and page styles.
- `tests/app/` contains component behavior tests.
- `tests/e2e/` remains reserved for later authenticated user-flow tests.

## Code Style

Use TypeScript, semantic HTML, native buttons for tabs, and CSS custom properties for the small page-level design system.

```tsx
<button aria-selected={isSelected} role="tab" type="button">
  Dashboard
</button>
```

## Testing Strategy

Vitest and React Testing Library verify the initial tab and tab-switching behavior. A browser run confirms that the development server renders the page without runtime errors.

## Boundaries

- Always: keep the page keyboard accessible, run the relevant checks, and document runnable commands.
- Ask first: add dependencies, change authentication, add data persistence, or change CI.
- Never: add card data, matching logic, credentials, or remote-service calls in this shell.

## Success Criteria

- The root route displays a Credit Card Match heading and three labeled tabs.
- Selecting a tab displays its matching empty-state message.
- The Docker development command serves the page at `http://localhost:3000`.
- Component tests, static checks, and the Next.js build pass.

## Open Questions

None for this preliminary shell.
