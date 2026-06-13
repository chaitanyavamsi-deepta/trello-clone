// Integration tests (LLD §6) — run against the database in DATABASE_URL.
// CI provides a Postgres service container; locally: createdb trello_clone_test.

const fs = require('fs');
const path = require('path');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../src/index');
const pool = require('../src/db');

beforeAll(async () => {
  const schema = fs.readFileSync(path.join(__dirname, '../migrations/schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(__dirname, '../migrations/seed.sql'), 'utf8');
  await pool.query(schema);
  await pool.query(seed);
});

afterAll(async () => {
  await pool.end();
});

describe('health', () => {
  it('responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('boards', () => {
  it('lists boards', async () => {
    const res = await request(app).get('/api/v1/boards');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('creates a board', async () => {
    const res = await request(app).post('/api/v1/boards').send({ title: 'Test Board' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Board');
    expect(res.body.background).toBe('gradient-purple');
  });

  it('rejects an empty title', async () => {
    const res = await request(app).post('/api/v1/boards').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects a title over 512 chars', async () => {
    const res = await request(app).post('/api/v1/boards').send({ title: 'x'.repeat(513) });
    expect(res.status).toBe(400);
  });

  it('returns the aggregate board payload', async () => {
    const res = await request(app).get('/api/v1/boards/1');
    expect(res.status).toBe(200);
    expect(res.body.lists).toHaveLength(3);
    expect(res.body.labels).toHaveLength(6);
    expect(res.body.members).toHaveLength(4);
    const firstList = res.body.lists[0];
    expect(firstList.title).toBe('Today');
    expect(firstList.cards.length).toBeGreaterThanOrEqual(3);
    const card = firstList.cards[0];
    expect(card).toHaveProperty('label_ids');
    expect(card).toHaveProperty('member_ids');
    expect(card).toHaveProperty('checklist_total');
  });

  it('404s on a missing board', async () => {
    const res = await request(app).get('/api/v1/boards/99999');
    expect(res.status).toBe(404);
  });

  it('400s on a non-integer id', async () => {
    const res = await request(app).get('/api/v1/boards/abc');
    expect(res.status).toBe(400);
  });

  it('stores SQL-injection-looking titles as inert text', async () => {
    const title = "'; DROP TABLE cards;--";
    const res = await request(app).post('/api/v1/boards').send({ title });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(title);
    const stillThere = await request(app).get('/api/v1/boards/1');
    expect(stillThere.status).toBe(200); // cards table survived
  });
});

describe('lists', () => {
  it('creates a list appended at the end', async () => {
    const res = await request(app).post('/api/v1/boards/1/lists').send({ title: 'Blocked' });
    expect(res.status).toBe(201);
    expect(Number(res.body.position)).toBeGreaterThan(3072);
  });

  it('reorders a list via fractional position', async () => {
    const res = await request(app).put('/api/v1/lists/2').send({ position: 512 });
    expect(res.status).toBe(200);
    const board = await request(app).get('/api/v1/boards/1');
    expect(board.body.lists[0].title).toBe('This Week');
  });

  it('deletes a list and cascades its cards', async () => {
    const created = await request(app).post('/api/v1/boards/1/lists').send({ title: 'Doomed' });
    const card = await request(app)
      .post(`/api/v1/lists/${created.body.id}/cards`)
      .send({ title: 'Doomed card' });
    const del = await request(app).delete(`/api/v1/lists/${created.body.id}`);
    expect(del.status).toBe(204);
    const gone = await request(app).get(`/api/v1/cards/${card.body.id}`);
    expect(gone.status).toBe(404);
  });
});

describe('cards', () => {
  it('creates a card', async () => {
    const res = await request(app).post('/api/v1/lists/1/cards').send({ title: 'New card' });
    expect(res.status).toBe(201);
    expect(res.body.list_id).toBe(1);
  });

  it('updates title and description', async () => {
    const res = await request(app)
      .put('/api/v1/cards/1')
      .send({ title: 'Renamed', description: 'Updated.' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Renamed');
    expect(res.body.description).toBe('Updated.');
  });

  it('moves a card to another list at a position', async () => {
    const res = await request(app).put('/api/v1/cards/1').send({ list_id: 2, position: 512 });
    expect(res.status).toBe(200);
    expect(res.body.list_id).toBe(2);
  });

  it('rejects a move to a list on another board', async () => {
    const other = await request(app).post('/api/v1/boards').send({ title: 'Other board' });
    const otherList = await request(app)
      .post(`/api/v1/boards/${other.body.id}/lists`)
      .send({ title: 'Foreign' });
    const res = await request(app).put('/api/v1/cards/1').send({ list_id: otherList.body.id });
    expect(res.status).toBe(404);
  });

  it('sets and clears a due date', async () => {
    const set = await request(app)
      .put('/api/v1/cards/2')
      .send({ due_date: '2026-07-01T12:00:00Z' });
    expect(set.status).toBe(200);
    expect(set.body.due_date).not.toBeNull();
    const clear = await request(app).put('/api/v1/cards/2').send({ due_date: null });
    expect(clear.status).toBe(200);
    expect(clear.body.due_date).toBeNull();
  });

  it('rejects a malformed due date', async () => {
    const res = await request(app).put('/api/v1/cards/2').send({ due_date: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('archives a card and hides it from the board', async () => {
    const created = await request(app).post('/api/v1/lists/1/cards').send({ title: 'Archive me' });
    await request(app).put(`/api/v1/cards/${created.body.id}`).send({ is_archived: true });
    const board = await request(app).get('/api/v1/boards/1');
    const allCardIds = board.body.lists.flatMap((l) => l.cards.map((c) => c.id));
    expect(allCardIds).not.toContain(created.body.id);
    const direct = await request(app).get(`/api/v1/cards/${created.body.id}`);
    expect(direct.status).toBe(200); // still retrievable
    expect(direct.body.is_archived).toBe(true);
  });

  it('rebalances when positions degrade', async () => {
    const list = await request(app).post('/api/v1/boards/1/lists').send({ title: 'Crowded' });
    await request(app).post(`/api/v1/lists/${list.body.id}/cards`).send({ title: 'A' });
    const b = await request(app).post(`/api/v1/lists/${list.body.id}/cards`).send({ title: 'B' });
    // Drop B's position below the MIN_GAP threshold to force a rebalance
    const res = await request(app).put(`/api/v1/cards/${b.body.id}`).send({ position: 1e-7 });
    expect(res.status).toBe(200);
    const board = await request(app).get('/api/v1/boards/1');
    const crowded = board.body.lists.find((l) => l.id === list.body.id);
    expect(crowded.cards.map((c) => c.title)).toEqual(['B', 'A']); // order preserved
    expect(Number(crowded.cards[1].position) - Number(crowded.cards[0].position)).toBeGreaterThan(1);
  });
});

describe('labels & members', () => {
  it('attaches a label idempotently', async () => {
    const first = await request(app).post('/api/v1/cards/2/labels').send({ label_id: 1 });
    const second = await request(app).post('/api/v1/cards/2/labels').send({ label_id: 1 });
    expect(first.status).toBe(204);
    expect(second.status).toBe(204);
    const card = await request(app).get('/api/v1/cards/2');
    expect(card.body.label_ids.filter((id) => id === 1)).toHaveLength(1);
  });

  it('rejects a label from another board', async () => {
    const other = await request(app).post('/api/v1/boards').send({ title: 'Label board' });
    const label = await request(app)
      .post(`/api/v1/boards/${other.body.id}/labels`)
      .send({ name: 'Foreign', color: '#000000' });
    const res = await request(app).post('/api/v1/cards/2/labels').send({ label_id: label.body.id });
    expect(res.status).toBe(404);
  });

  it('assigns and unassigns a member', async () => {
    await request(app).post('/api/v1/cards/3/members').send({ member_id: 1 });
    let card = await request(app).get('/api/v1/cards/3');
    expect(card.body.member_ids).toContain(1);
    await request(app).delete('/api/v1/cards/3/members/1');
    card = await request(app).get('/api/v1/cards/3');
    expect(card.body.member_ids).not.toContain(1);
  });
});

describe('checklists', () => {
  it('adds a checklist with items and toggles completion', async () => {
    const checklist = await request(app)
      .post('/api/v1/cards/3/checklists')
      .send({ title: 'Steps' });
    expect(checklist.status).toBe(201);
    const item = await request(app)
      .post(`/api/v1/checklists/${checklist.body.id}/items`)
      .send({ content: 'First step' });
    expect(item.status).toBe(201);
    const toggled = await request(app)
      .put(`/api/v1/checklist-items/${item.body.id}`)
      .send({ is_complete: true });
    expect(toggled.body.is_complete).toBe(true);
  });
});

describe('comments', () => {
  it('adds a comment, returns it on the card, and deletes it', async () => {
    const added = await request(app)
      .post('/api/v1/cards/1/comments')
      .send({ body: 'Looks good to me' });
    expect(added.status).toBe(201);
    expect(added.body.body).toBe('Looks good to me');
    expect(added.body.member_name).toBeTruthy(); // author joined in

    const card = await request(app).get('/api/v1/cards/1');
    expect(card.body.comments.some((c) => c.id === added.body.id)).toBe(true);

    const del = await request(app).delete(`/api/v1/comments/${added.body.id}`);
    expect(del.status).toBe(204);
  });

  it('rejects an empty comment body', async () => {
    const res = await request(app).post('/api/v1/cards/1/comments').send({ body: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('search', () => {
  it('finds cards by title substring, case-insensitive', async () => {
    const res = await request(app).get('/api/v1/boards/1/cards/search?q=DRAG');
    expect(res.status).toBe(200);
    expect(res.body.some((c) => /drag/i.test(c.title))).toBe(true);
  });

  it('returns [] for an empty query', async () => {
    const res = await request(app).get('/api/v1/boards/1/cards/search?q=');
    expect(res.body).toEqual([]);
  });
});
