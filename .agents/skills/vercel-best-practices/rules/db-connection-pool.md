# db-connection-pool

**Rule:** Reuse a shared connection pool rather than opening a connection per request, and use the provider's pooled endpoint in serverless.

**Why:** TCP + auth handshakes per request are expensive; unbounded connections exhaust the database's limit. Serverless multiplies this — each function instance opens its own connections.

**Where we apply it:**
- `server/src/db.js` — a single `pg` `Pool` is created once and shared across all repositories; queries borrow/return connections.
- **Deployment:** the API runs on Vercel serverless against **Neon's pooled endpoint** (`-pooler` host), so PgBouncer multiplexes many short-lived function instances onto a few real Postgres connections.

**Avoid:** `new Client()` per request, or pointing serverless at Neon's direct (non-pooled) endpoint.
