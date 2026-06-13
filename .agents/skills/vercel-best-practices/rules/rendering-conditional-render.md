# rendering-conditional-render

**Rule:** Mount heavy or rarely-shown subtrees only when needed (`{open && <Panel/>}`), rather than always rendering them hidden with CSS.

**Why:** Skips the render, effects, and DOM cost of components the user isn't looking at.

**Where we apply it:**
- `client/src/pages/BoardPage.jsx` — `CardModal` mounts only when `?card=:id` is present; the quick-edit popover and its backdrop only when a card is being quick-edited.
- Pickers (`LabelPicker`/`MemberPicker`), the filter panel, list menus, and the members popover render only while open.

**Avoid:** Always rendering the modal/pickers and toggling `display:none` — they still run effects and hold DOM.
