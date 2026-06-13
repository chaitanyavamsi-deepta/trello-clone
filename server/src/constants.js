// Application-wide constants — validation limits, enums, shared values.
// Keeping them here means changing a limit updates all routes + tests together.

const LIMITS = {
  title: 512,
  description: 5000,
  checklistTitle: 512,
  checklistItem: 1024,
  comment: 5000,
  labelName: 128,
  labelColor: 7,
  background: 64,
  searchResults: 10,
};

// No auth: comments are attributed to the assumed logged-in user (members.id = 1).
const DEFAULT_USER_ID = 1;

// Background preset keys stored in the DB
const BACKGROUNDS = {
  DEFAULT: 'gradient-purple',
  PURPLE: 'gradient-purple',
  BLUE: 'gradient-blue',
  GREEN: 'gradient-green',
  CRIMSON: 'gradient-crimson',
};

module.exports = { LIMITS, BACKGROUNDS, DEFAULT_USER_ID };
