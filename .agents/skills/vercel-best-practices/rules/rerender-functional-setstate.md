# rerender-functional-setstate

**Rule:** Use the functional updater form `setState(prev => next)` when the new value derives from the previous one.

**Why:** Reads the latest state without adding it to effect/callback dependencies, avoiding stale-closure bugs and unnecessary re-subscriptions.

**Where we apply it:**
- `client/src/hooks/useBoard.js` — `mutate(updater, persist)` applies `updater` to the previous board tree functionally, so every optimistic action composes off the current state regardless of render timing.
- Toggle handlers (`setWsOpen(v => !v)`, `setMembersOpen(v => !v)`, `setCollapsed(v => !v)`) flip based on the previous value.

**Avoid:** `setBoard(board)` using a `board` captured in a closure that may be stale by the time the callback runs.
