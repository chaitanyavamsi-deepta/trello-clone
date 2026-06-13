# rerender-use-ref-transient-values

**Rule:** Store values that must persist across renders but should **not** trigger a re-render in a `useRef`, not `useState`.

**Why:** Mutating a ref is free and silent; putting transient/in-flight values in state would cause spurious re-renders mid-interaction.

**Where we apply it:**
- `client/src/pages/BoardPage.jsx` — `dragSnapshot = useRef(null)` holds the pre-drag board snapshot for rollback; it changes during a drag but must not re-render the board.
- `client/src/hooks/useBoard.js` — a `boardRef` mirrors state so async persistence reads the latest tree without re-subscribing.
- `client/src/components/common/FilterBar.jsx` — `debounce = useRef(null)` holds the search debounce timer.

**Avoid:** `useState` for a debounce timer, a drag snapshot, or any value the UI doesn't render.
