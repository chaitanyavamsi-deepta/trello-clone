# React Performance Best Practices (Vite SPA + Express)

A curated set of React/JavaScript performance rules **as applied in this codebase**.
Adapted from Vercel's React best-practices guidance, scoped to **our actual stack** —
a client-side Vite SPA with an Express REST API. Server-Component / SSR / Next.js
rules are intentionally excluded because they do not apply here.

Every rule links to where the pattern lives in this repo, so it doubles as a
map of the deliberate performance decisions in the code.

## When to use

Consult these rules when:
- adding or refactoring a React component or hook in `client/src/`
- touching state, effects, or data-derivation logic
- reviewing a diff for unnecessary re-renders or wasted work

## Categories

**Frontend (React SPA)**
- **rerender-*** — avoid unnecessary re-renders and wasted state work
- **client-*** — browser-side correctness (listeners, storage)
- **rendering-*** — render/paint less

**Cross-tier (general JavaScript)**
- **js-*** — algorithmic / data-structure efficiency in hot paths (used on both client and server)
- **async-*** — parallelize independent I/O

**Backend (Express + PostgreSQL)**
- **db-*** — query shape, indexing, pooling, and transactions:
  `db-aggregate-query` (no N+1), `db-partial-index`, `db-connection-pool`,
  `db-transaction-locking`, `db-limit-results`

See [rules/](rules/) for the individual rules and [AGENTS.md](AGENTS.md) for how an
agent should apply them.

## Out of scope (does not apply to this stack)

`server-*`, `async-suspense-boundaries`, `rendering-hydration-*`, `async-api-routes`,
and other React Server Component / SSR rules — this project is a Vite SPA, not Next.js.
