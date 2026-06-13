-- Seed data (schema-design.md): sample members, board, labels, lists, cards.
-- Relative due dates (now() ± interval) so the demo never goes stale.

INSERT INTO members (name, email, avatar_color) VALUES
  ('Alice Johnson', 'alice@example.com', '#eb5a46'),
  ('Bob Martinez',  'bob@example.com',   '#61bd4f'),
  ('Carol Chen',    'carol@example.com', '#c377e0'),
  ('Dave Okafor',   'dave@example.com',  '#ff9f1a');

-- 'gradient-purple' is a client-side preset key (resolves to a CSS gradient)
INSERT INTO boards (title, background) VALUES
  ('Project Phoenix', 'gradient-purple');

-- Trello's default label palette
INSERT INTO labels (board_id, name, color) VALUES
  (1, 'Urgent',   '#eb5a46'),
  (1, 'Feature',  '#61bd4f'),
  (1, 'Bug',      '#f2d600'),
  (1, 'Design',   '#c377e0'),
  (1, 'Backend',  '#0079bf'),
  (1, 'Research', '#ff9f1a');

INSERT INTO lists (board_id, title, position) VALUES
  (1, 'Today',     1024),
  (1, 'This Week', 2048),
  (1, 'Later',     3072);

INSERT INTO cards (list_id, title, description, due_date, position) VALUES
  (1, 'Design database schema',
      'Model boards, lists, cards, labels, members, and checklists with proper relationships and cascade rules.',
      now() - interval '1 day', 1024),                            -- overdue
  (1, 'Set up CI pipeline',
      'GitHub Actions: lint, server tests against a Postgres service container, client build.',
      NULL, 2048),
  (1, 'Write API documentation', '', now() + interval '3 days', 3072),
  (2, 'Implement drag and drop',
      'Use @dnd-kit with optimistic updates and fractional positioning.',
      now() + interval '12 hours', 1024),                         -- due soon
  (2, 'Build card detail modal',
      'Labels, due date, checklist, and member assignment.',
      NULL, 2048),
  (2, 'Responsive layout pass', 'Mobile/tablet breakpoints, snap-scrolling columns.', NULL, 3072),
  (3, 'Project scaffolding', 'Vite + React client, Express server, Postgres.', NULL, 1024),
  (3, 'Choose tech stack', 'Documented in docs/architecture-decisions.md.', NULL, 2048);

INSERT INTO card_labels (card_id, label_id) VALUES
  (1, 5), (1, 1),
  (2, 5),
  (3, 6),
  (4, 2), (4, 1),
  (5, 2), (5, 4),
  (6, 4),
  (7, 2),
  (8, 6);

INSERT INTO card_members (card_id, member_id) VALUES
  (1, 1), (1, 2),
  (2, 4),
  (4, 2), (4, 3),
  (5, 3),
  (6, 1),
  (7, 4),
  (8, 1);

INSERT INTO checklists (card_id, title, position) VALUES
  (4, 'Drag and drop tasks', 1024);

INSERT INTO checklist_items (checklist_id, content, is_complete, position) VALUES
  (1, 'Reorder lists horizontally', true,  1024),
  (1, 'Move cards across lists',    true,  2048),
  (1, 'Persist fractional positions on drop', false, 3072);

INSERT INTO card_comments (card_id, member_id, body) VALUES
  (4, 2, 'Started with @dnd-kit — the multi-container sortable preset fits our lists/cards model.'),
  (4, 3, 'Nice. Let''s make sure the drop persists optimistically so it feels instant.');
