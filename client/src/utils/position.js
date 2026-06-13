// Client side of the fractional-positioning contract (LLD §2): when an item
// lands at index i, its new position is the midpoint of its neighbors.
const STEP = 1024;

export function positionBetween(prev, next) {
  if (prev == null && next == null) return STEP;
  if (prev == null) return next / 2;
  if (next == null) return prev + STEP;
  return (prev + next) / 2;
}

// Position for an item placed at `index` within `items` (item already removed).
export function positionAt(items, index) {
  const prev = index > 0 ? Number(items[index - 1].position) : null;
  const next = index < items.length ? Number(items[index].position) : null;
  return positionBetween(prev, next);
}
