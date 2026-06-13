# rerender-memo

**Rule:** Wrap an expensive derivation in `useMemo` when it iterates non-trivial data and its inputs don't change every render.

**Why:** Avoids recomputing on unrelated re-renders. Only worth it when the work is real — memoizing a cheap expression costs more than it saves.

**Where we apply it:**
- `client/src/pages/BoardPage.jsx` — `dimmedCardIds = useMemo(...)` walks every card across every list to decide which to dim under the active search/filters. It recomputes only when `board`, `filters`, `searchIds`, or `filtersActive` change — not on unrelated state updates (e.g. opening a menu).

**Avoid:** Recomputing the full set of dimmed cards inline on every render, or memoizing trivial scalars.
