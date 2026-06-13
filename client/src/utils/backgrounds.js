// Board backgrounds: the DB stores a color or a preset key (schema-design.md).
// Preset keys resolve to gradients client-side, like modern Trello boards.
const PRESETS = {
  'gradient-purple':  'linear-gradient(170deg, #6e5dc6 0%, #7e5ec9 25%, #e774bb 100%)',
  'gradient-blue':    'linear-gradient(135deg, #0747a6 0%, #4c3a99 100%)',
  'gradient-green':   'linear-gradient(135deg, #1f845a 0%, #4bce97 100%)',
  'gradient-crimson': 'linear-gradient(135deg, #ae2e24 0%, #d3451f 100%)',
};

// Dynamic background — the solid color Trello derives from the board background,
// used to tint the AppNav and board-header (matches --dynamic-background CSS var).
const DYNAMIC_BG = {
  'gradient-purple':  'hsl(250, 47.9%, 40.7%)',
  'gradient-blue':    'hsl(228, 90%, 30%)',
  'gradient-green':   'hsl(153, 62%, 29%)',
  'gradient-crimson': 'hsl(4, 65%, 30%)',
};

export function resolveBackground(value) {
  return PRESETS[value] || value || '#0079bf';
}

export function resolveDynamicBg(value) {
  return DYNAMIC_BG[value] || '#1d2125';
}
