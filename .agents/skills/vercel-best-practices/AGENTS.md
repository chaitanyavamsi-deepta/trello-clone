# AGENTS.md — applying the React performance rules

When working in `client/src/`, apply [rules/](rules/) in this order of priority:

1. **Correctness first** — a rule never justifies changing behavior. If a perf
   change alters output, it's a bug.
2. **Derive, don't store** — prefer computing during render over `useState` +
   `useEffect` syncing (`rerender-derived-state-no-effect`).
3. **Stable references** — functional `setState`, refs for transient values, and
   `useMemo`/`useCallback` only where a measured re-render or expensive compute
   exists (`rerender-*`). Don't memoize trivially cheap expressions.
4. **Efficient data structures** in hot paths — `Set`/`Map` lookups, early exits,
   index maps (`js-*`). The board render iterates every card on each filter change.
5. **Parallel I/O** — independent fetches use `Promise.all` (`async-parallel`).
6. **Clean up** every listener / timer in `useEffect` (`client-event-listeners`).

## How to cite a rule

Each rule file states the rule, the reason, and **where we already apply it**.
When adding code, match the existing pattern and reference the rule id in the PR
or commit body if it's a non-obvious perf decision.

## Guardrails

- Do not introduce SSR/RSC patterns — this is a Vite SPA.
- Do not add memoization without a real re-render or cost to justify it; needless
  `useMemo` adds overhead and noise.
- Keep pure state transforms at module scope (see `client/src/hooks/useBoard.js`)
  so they aren't recreated each render and have no stale-closure hazards.
