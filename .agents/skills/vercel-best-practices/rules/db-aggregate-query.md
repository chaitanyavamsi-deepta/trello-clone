# db-aggregate-query

**Rule:** Assemble a nested resource in a single SQL round trip using `json_agg`/`array_agg` subqueries, instead of fetching parents then looping to fetch children (the N+1 problem).

**Why:** One query over the wire beats 1 + N (lists) + N×M (cards) queries. The board view's first paint depends entirely on this call.

**Where we apply it:**
- `server/src/repositories/boardRepository.js` — `getBoardWithDetails` returns the board, its lists, and each card's `label_ids` / `member_ids` (via `array_agg` subqueries) plus checklist counts, in one statement. The frontend renders the whole board from this single payload (`GET /api/v1/boards/:id`).

**Avoid:** Fetching lists, then a cards query per list, then a labels/members query per card.
