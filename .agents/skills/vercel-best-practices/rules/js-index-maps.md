# js-index-maps

**Rule:** When joining two collections, build a `Map` index once and look up, instead of calling `.filter`/`.find` inside a loop (O(n+m) vs O(n·m)).

**Why:** Nested find turns an aggregate assembly into quadratic work as lists/cards grow.

**Where we apply it:**
- `server/src/repositories/boardRepository.js` — after fetching all cards for a board, we bucket them into a `cardsByList` `Map` in a single pass, then attach each list's cards by key. No per-list re-scan of the full card array.

**Avoid:** `lists.map(l => ({ ...l, cards: allCards.filter(c => c.list_id === l.id) }))` (re-scans every card for every list).
