-- Trello Clone schema (docs/schema-design.md)
-- Idempotent: safe to re-run on a fresh database.

DROP TABLE IF EXISTS checklist_items, checklists, card_members, card_labels,
                     labels, cards, lists, boards, members CASCADE;

CREATE TABLE members (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    avatar_color VARCHAR(7)   NOT NULL DEFAULT '#0079bf',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE boards (
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(512) NOT NULL,
    background VARCHAR(64)  NOT NULL DEFAULT '#0079bf',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE lists (
    id         SERIAL PRIMARY KEY,
    board_id   INTEGER      NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title      VARCHAR(512) NOT NULL,
    position   DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE cards (
    id          SERIAL PRIMARY KEY,
    list_id     INTEGER      NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title       VARCHAR(512) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    due_date    TIMESTAMPTZ,
    position    DOUBLE PRECISION NOT NULL,
    is_archived BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE labels (
    id       SERIAL PRIMARY KEY,
    board_id INTEGER      NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name     VARCHAR(128) NOT NULL DEFAULT '',
    color    VARCHAR(7)   NOT NULL
);

CREATE TABLE card_labels (
    card_id  INTEGER NOT NULL REFERENCES cards(id)  ON DELETE CASCADE,
    label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, label_id)
);

CREATE TABLE card_members (
    card_id   INTEGER NOT NULL REFERENCES cards(id)   ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, member_id)
);

CREATE TABLE checklists (
    id       SERIAL PRIMARY KEY,
    card_id  INTEGER      NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    title    VARCHAR(512) NOT NULL,
    position DOUBLE PRECISION NOT NULL
);

CREATE TABLE checklist_items (
    id           SERIAL PRIMARY KEY,
    checklist_id INTEGER       NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    content      VARCHAR(1024) NOT NULL,
    is_complete  BOOLEAN       NOT NULL DEFAULT false,
    position     DOUBLE PRECISION NOT NULL
);

CREATE INDEX idx_lists_board     ON lists(board_id, position);
CREATE INDEX idx_cards_list      ON cards(list_id, position) WHERE NOT is_archived;
CREATE INDEX idx_labels_board    ON labels(board_id);
CREATE INDEX idx_checklists_card ON checklists(card_id);
CREATE INDEX idx_items_checklist ON checklist_items(checklist_id);
