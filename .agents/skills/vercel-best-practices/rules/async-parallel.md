# async-parallel

**Rule:** Fire independent async calls together with `Promise.all` instead of awaiting them sequentially.

**Why:** Sequential awaits sum their latencies; parallel awaits take only the slowest. Critical for the aggregate board fetch.

**Where we apply it:**
- `server/src/repositories/boardRepository.js` — `getBoardWithDetails` runs the lists, cards, labels, and members queries in a single `Promise.all`.
- `server/src/repositories/cardRepository.js` — `getCardWithDetails` fetches labels, members, and checklists in parallel.

**Avoid:** `const lists = await q1(); const cards = await q2(); const labels = await q3();` when none depends on the others.
