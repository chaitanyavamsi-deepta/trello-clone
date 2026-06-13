# client-localstorage-schema

**Rule:** Treat `localStorage` as untrusted: wrap reads/`JSON.parse` in try/catch and tolerate missing or corrupt data.

**Why:** Stored JSON can be malformed (manual edits, version drift, quota errors). An unguarded `JSON.parse` throws and can white-screen the app on load.

**Where we apply it:**
- `client/src/pages/BoardsHome.jsx` — `readRecentBoards()` wraps `JSON.parse(localStorage.getItem('recentBoards'))` in try/catch and falls back to `[]`.
- `client/src/pages/BoardPage.jsx` — the recent-boards writer reads the existing list defensively before appending.
- Recents are also re-resolved against fresh board data, so stale ids/titles can't render.

**Avoid:** `const recent = JSON.parse(localStorage.getItem('recentBoards'))` with no guard.
