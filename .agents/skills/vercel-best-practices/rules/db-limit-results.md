# db-limit-results

**Rule:** Bound result sets at the database with `LIMIT` for queries that feed a capped UI, instead of fetching everything and slicing in JS.

**Why:** The DB does less work, less data crosses the wire, and the response stays small regardless of how much matches.

**Where we apply it:**
- `server/src/repositories/boardRepository.js` — `searchCards` ends with `LIMIT 10`; the search dropdown only shows a short list, so there's no reason to return every match.

**Avoid:** `SELECT … ILIKE …` returning thousands of rows that the client then trims to 10.
