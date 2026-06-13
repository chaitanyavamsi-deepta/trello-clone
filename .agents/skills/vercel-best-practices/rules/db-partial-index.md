# db-partial-index

**Rule:** Index the exact shape of the hot query, including a `WHERE` clause to keep the index small and aligned with how rows are actually read.

**Why:** A partial index over only the rows you query is smaller, faster to scan, and excludes irrelevant rows (archived cards) from the index entirely.

**Where we apply it:**
- `server/migrations/schema.sql` — `CREATE INDEX idx_cards_list ON cards(list_id, position) WHERE NOT is_archived;`. The board fetch reads non-archived cards per list ordered by position; this index serves that query directly and never carries archived rows.
- Companion indexes: `idx_lists_board(board_id, position)`, `idx_labels_board`, `idx_checklists_card`, `idx_items_checklist`.

**Avoid:** A plain `cards(list_id)` index that includes archived rows and ignores the `position` sort.
