# rerender-derived-state-no-effect

**Rule:** Compute values that can be derived from existing state/props **during render**, not by mirroring them into extra state via `useEffect`.

**Why:** A `useState` + `useEffect` sync runs an extra render and risks stale/incoherent intermediate frames. Deriving inline is simpler and always consistent.

**Where we apply it:**
- `client/src/pages/BoardsHome.jsx` — `visible` (title-filtered boards) and `recent` (recently-viewed, resolved against fresh board data) are computed in the render body, not stored.
- `client/src/pages/BoardPage.jsx` — `filtersActive` is derived inline from the current filters.

**Avoid:** `const [visible, setVisible] = useState([])` + `useEffect(() => setVisible(boards.filter(...)), [boards, q])`.
