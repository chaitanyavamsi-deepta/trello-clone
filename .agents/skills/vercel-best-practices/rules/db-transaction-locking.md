# db-transaction-locking

**Rule:** Wrap a multi-step write in a transaction, and lock the row you're about to mutate with `SELECT … FOR UPDATE` so concurrent writers can't interleave.

**Why:** A card move reads the card, validates the target list, computes a position, updates, and may rebalance the container. Without a transaction + row lock, two concurrent moves could corrupt ordering or read a half-applied state.

**Where we apply it:**
- `server/src/repositories/cardRepository.js` — `lockCard` does `SELECT * FROM cards WHERE id = $1 FOR UPDATE`.
- `server/src/services/cardService.js` — `updateCard` runs `BEGIN` → lock → same-board check → update → `rebalanceIfNeeded` → `COMMIT` (rolling back on any error), so a reader never sees a partially-renumbered list.

**Avoid:** Reading, computing, and writing position across separate auto-committed statements with no lock.
