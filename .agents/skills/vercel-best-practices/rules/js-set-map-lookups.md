# js-set-map-lookups

**Rule:** Use `Set`/`Map` for membership tests and keyed lookups in hot paths instead of `Array.includes`/`find` (O(1) vs O(n)).

**Why:** The board re-renders on every drag, filter, and search keystroke. Linear scans per card per render add up quickly as cards grow.

**Where we apply it:**
- `client/src/pages/BoardPage.jsx` — `dimmedCardIds` is a `Set`; each `CardItem` checks membership in O(1) (`dimmedCardIds.has(card.id)`).
- Search results (`searchIds`) are kept as a `Set` for the same per-card check.
- `server/src/repositories/boardRepository.js` — `cardsByList` is a `Map` keyed by `list_id` to bucket cards in one pass.

**Avoid:** `dimmedCards.includes(card.id)` inside a `.map` over every card on every render.
