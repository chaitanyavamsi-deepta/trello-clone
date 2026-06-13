# client-event-listeners

**Rule:** Every `addEventListener` (and timer/subscription) added in a `useEffect` must be removed in the effect's cleanup, and only attached while needed.

**Why:** Leaked listeners fire after unmount, stack up across renders, and cause memory leaks and double-handling.

**Where we apply it:**
- Click-outside handlers attach `mousedown` only while the popover is open and remove it on cleanup — `FilterBar.jsx` (filter panel + search dropdown), `ListColumn.jsx` (list menu), `CardModal.jsx` (label/member pickers), `BoardsHome.jsx` (members popover).
- `CardModal.jsx` adds an `Escape` `keydown` listener and removes it on cleanup.

**Avoid:** Adding a document listener without a returned cleanup, or attaching it unconditionally when the UI it serves is closed.
