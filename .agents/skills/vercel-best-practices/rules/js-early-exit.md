# js-early-exit

**Rule:** Return as soon as the answer is known; check the cheapest disqualifying condition first.

**Why:** Skips the rest of the work for the common case. In per-card predicates this runs thousands of times.

**Where we apply it:**
- `client/src/components/common/FilterBar.jsx` — `cardMatchesFilters` returns `false` the moment a label/member/due check fails, rather than computing all criteria then ANDing them.
- `matchesDue` returns early for the `none` case before parsing a date.

**Avoid:** Building up a `let ok = labelOk && memberOk && dueOk` that evaluates every branch even after one already failed.
