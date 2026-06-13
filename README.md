# Trello Clone

A Kanban-style project management app that mirrors Trello's design and interactions: boards hold lists, lists hold cards, and you drag things around to organize work. Cards support labels, due dates, checklists, and members, and there's search and filtering on top. It's a React single-page app talking to an Express REST API over PostgreSQL.

**Live app:** https://trello-clone-cvk.vercel.app

> The API runs as Vercel serverless functions against Neon (serverless Postgres), so the first request after it's been idle can take a second or two to warm up.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Backend Layers](#backend-layers)
- [Database Schema](#database-schema)
- [Request Lifecycle](#request-lifecycle)
- [Drag and Drop](#drag-and-drop)
- [Fractional Positioning](#fractional-positioning)
- [Frontend State](#frontend-state)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Performance Notes](#performance-notes)
- [Design Decisions](#design-decisions)
- [Assumptions](#assumptions)

## Tech Stack

| Tier | Technology |
|------|-----------|
| Frontend | React 18 (Vite), @dnd-kit, React Router |
| Backend | Node.js 20, Express 4, raw SQL via node-postgres (no ORM) |
| Database | PostgreSQL 16 (Neon in production) |
| Testing | Jest + Supertest, 26 integration tests against a real Postgres |
| CI/CD | GitHub Actions (path-filtered), Vercel for the client and the serverless API, Neon for data |

## Features

Core:

- Create boards and view them; multiple boards are supported
- Lists: create, rename, delete, and drag to reorder
- Cards: create, edit title and description, archive, drag within a list and across lists
- Card details: colored labels, due dates (with overdue and due-soon badges), checklists with a progress bar, and member assignment
- Server-side title search (debounced, shows a result dropdown)
- Client-side filters by label, member, and due-date window (overdue, next day, next week, next month)

Smaller touches to match Trello's feel:

- Optimistic drag and drop that rolls back if the save fails
- A card completion toggle with a little burst animation
- Quick-edit popover and inline title/description editing
- Board-tinted header over the gradient background
- Loading spinners and view transitions

## System Architecture

Three tiers with a clean split: the browser never sees SQL, the server never renders HTML, and Postgres is the source of truth.

```mermaid
graph TB
    subgraph Client["Client - React SPA (Vercel)"]
        UI["Pages and Components<br/>BoardPage, CardModal, ListColumn"]
        Hook["useBoard hook<br/>(optimistic state + rollback)"]
        APIClient["api/client.js<br/>(fetch wrapper to /api/v1)"]
        UI --> Hook --> APIClient
    end

    subgraph Server["Server - Express API (Vercel serverless)"]
        MW["Middleware<br/>helmet, CORS, rate-limit, validate"]
        Ctrl["Controllers"]
        Svc["Services<br/>(business logic + transactions)"]
        Repo["Repositories<br/>(SQL)"]
        MW --> Ctrl --> Svc --> Repo
    end

    subgraph DB["Neon PostgreSQL"]
        Tables["9 tables<br/>boards, lists, cards, labels,<br/>members, checklists, junctions"]
    end

    APIClient -->|"HTTPS / JSON"| MW
    Repo -->|"parameterized SQL (pooled)"| Tables

    style Client fill:#e9f2fe,stroke:#1868db
    style Server fill:#e6fcf5,stroke:#0ca678
    style DB fill:#fff3bf,stroke:#f59f00
```

The whole board renders from one call (`GET /api/v1/boards/:id`), so there's no waterfall of per-list or per-card requests.

## Backend Layers

Requests flow route to controller to service to repository. SQL stays in the repositories, so HTTP handlers and business rules each stay testable on their own.

| Layer | What it does | Example |
|-------|--------------|---------|
| Route | Maps a verb and path to a controller and attaches `validate()` / `intParam()` | `router.put('/cards/:id', intParam('id'), validate({...}), ctrl.updateCard)` |
| Controller | Reads the request, calls a service, turns the result into a response | `cardController.updateCard` |
| Service | Business logic, transactions, cross-resource checks | `cardService.updateCard` (BEGIN, lock, move, rebalance, COMMIT) |
| Repository | Parameterized SQL only, no HTTP and no rules | `cardRepository.updateCard` |

Shared concerns sit in `middleware/` (validation, error handling) and `utils/` (position math, an async wrapper), with config and constants centralized in `config.js` and `constants.js`.

## Database Schema

Nine tables. A board owns its lists, a list owns its cards, and a card owns its checklists and their items. Labels belong to a board; members are global. Cards link to labels and members through junction tables with composite primary keys. Everything cascades on delete.

```mermaid
erDiagram
    boards ||--o{ lists : has
    boards ||--o{ labels : defines
    lists ||--o{ cards : contains
    cards ||--o{ checklists : has
    checklists ||--o{ checklist_items : has
    cards }o--o{ labels : card_labels
    cards }o--o{ members : card_members

    boards {
        serial id PK
        varchar title
        varchar background
        timestamptz created_at
    }
    lists {
        serial id PK
        int board_id FK
        varchar title
        double position
    }
    cards {
        serial id PK
        int list_id FK
        varchar title
        text description
        timestamptz due_date
        double position
        bool is_archived
    }
    labels {
        serial id PK
        int board_id FK
        varchar name
        varchar color
    }
    members {
        serial id PK
        varchar name
        varchar email UK
        varchar avatar_color
    }
    card_labels {
        int card_id PK
        int label_id PK
    }
    card_members {
        int card_id PK
        int member_id PK
    }
    checklists {
        serial id PK
        int card_id FK
        varchar title
        double position
    }
    checklist_items {
        serial id PK
        int checklist_id FK
        varchar content
        bool is_complete
        double position
    }
```

A few choices worth calling out:

- `position` is a `DOUBLE PRECISION` on lists, cards, and items. That's what makes [fractional positioning](#fractional-positioning) work.
- The partial index `idx_cards_list ON cards(list_id, position) WHERE NOT is_archived` keeps the board-fetch query fast and leaves archived cards out of the index entirely.
- The composite primary keys on the junction tables make assigning a label or member idempotent (`ON CONFLICT DO NOTHING`).

## Request Lifecycle

Every call goes through the same chain, and validation rejects bad input before any database work happens:

`helmet, CORS allowlist, json (100kb cap), rate limit (300/min), validate(), controller, service, repository, central errorHandler`

If `validate()` fails, the request gets a 400 without touching the DB. Anything that throws downstream is caught by the central error handler, which never leaks stack traces in production.

## Drag and Drop

Drag and drop is optimistic. The UI updates right away, the save happens in the background, and it rolls back if the save fails:

1. `onDragStart`: take a snapshot of the board tree to roll back to
2. `onDragOver`: move the card between lists in local state for a live preview
3. `onDragEnd`: compute the midpoint position, apply it locally, then `PUT /cards/:id` in the background
4. Server: runs the `UPDATE` in a transaction and rebalances if the gap got too small
5. If it fails: restore the snapshot and show a toast

## Fractional Positioning

Each list, card, and checklist item carries a floating-point `position`. Reordering is a single-row `UPDATE` to the midpoint between the new neighbors, so the rest of the list never has to be renumbered.

```
Initial:   [A: 1024]   [B: 2048]   [C: 3072]
Move C between A and B  ->  midpoint(1024, 2048) = 1536
Result:    [A: 1024]   [C: 1536]   [B: 2048]
```

After enough midpoint splits the gap can shrink below `1e-6`. When that happens the server rebalances the whole container back to clean multiples of 1024, in the same transaction as the move, so a read never sees a half-renumbered list.

- Client midpoint: [client/src/utils/position.js](client/src/utils/position.js)
- Server append and rebalance: [server/src/utils/position.js](server/src/utils/position.js)

This is the same idea Trello and Jira use. Their production version, LexoRank, uses lexicographic strings instead of floats for unbounded precision, which would be the natural next step.

## Frontend State

`main.jsx` (ReactDOM root and Router) renders `App.jsx` (routes), which renders `BoardsHome` at `/` and `BoardPage` at `/b/:id`. `BoardPage` owns the single `DndContext` and renders `ListColumn` then `CardItem`. `CardModal` is a `?card=:id` deep link that only mounts when a card is open.

State lives in [useBoard](client/src/hooks/useBoard.js): the canonical board tree in a ref-mirrored state, pure transforms at module scope, and actions that wrap them with `mutate(updater, persist)`. Each action applies the change locally, persists in the background, and restores the snapshot if the request fails.

## API Reference

Base URL is `/api/v1`. The health check lives at `/api/health`. Everything is JSON, and every input is validated before any database call.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` (unversioned) | Liveness check, returns `{ ok: true }` |
| GET | `/boards` | List all boards |
| POST | `/boards` | Create a board |
| GET | `/boards/:id` | Aggregate board: lists with cards, label and member ids, checklist counts, plus board labels and members |
| PUT | `/boards/:id` | Update board title or background |
| DELETE | `/boards/:id` | Delete a board (cascades) |
| GET | `/boards/:boardId/cards/search?q=` | Title search, up to 10 results |
| POST | `/boards/:boardId/lists` | Create a list |
| PUT | `/lists/:id` | Rename or reorder a list |
| DELETE | `/lists/:id` | Delete a list (cascades its cards) |
| POST | `/lists/:listId/cards` | Create a card |
| GET | `/cards/:id` | Card detail including checklists |
| PUT | `/cards/:id` | Edit, move, or archive a card (transactional) |
| DELETE | `/cards/:id` | Delete a card |
| GET | `/boards/:boardId/labels` | List a board's labels |
| POST | `/boards/:boardId/labels` | Create a label |
| POST | `/cards/:cardId/labels` | Attach a label (idempotent) |
| DELETE | `/cards/:cardId/labels/:labelId` | Detach a label |
| GET | `/members` | List all members |
| POST | `/cards/:cardId/members` | Assign a member (idempotent) |
| DELETE | `/cards/:cardId/members/:memberId` | Unassign a member |
| POST | `/cards/:cardId/checklists` | Add a checklist |
| DELETE | `/checklists/:id` | Delete a checklist |
| POST | `/checklists/:checklistId/items` | Add a checklist item |
| PUT | `/checklist-items/:id` | Toggle or edit an item |
| DELETE | `/checklist-items/:id` | Delete an item |

Validation limits, which are part of the API contract: title up to 512, description up to 5000, checklist item up to 1024, label name up to 128.

## Project Structure

```
trello-clone/
├── client/                      # React SPA (Vite)
│   ├── src/
│   │   ├── pages/               # BoardsHome, BoardPage
│   │   ├── components/          # board/, card/, common/
│   │   ├── hooks/useBoard.js    # optimistic state + rollback
│   │   ├── api/client.js        # fetch wrapper to /api/v1
│   │   └── utils/               # position midpoint, backgrounds
│   └── vercel.json              # SPA rewrite
├── server/                      # Express REST API
│   ├── src/
│   │   ├── routes/              # endpoint registration
│   │   ├── controllers/         # HTTP request/response
│   │   ├── services/            # business logic + transactions
│   │   ├── repositories/        # raw SQL
│   │   ├── middleware/          # validate, errorHandler
│   │   ├── utils/               # fractional position, async wrap
│   │   ├── config.js            # centralized env config
│   │   └── constants.js         # validation limits, enums
│   ├── migrations/              # schema.sql, seed.sql, test-db.sql
│   ├── test/                    # 26 supertest integration tests
│   └── vercel.json              # serverless function config
├── .agents/skills/              # React + Postgres performance skill
│   └── vercel-best-practices/   # 16 rules mapped to this codebase
├── .github/workflows/           # server.yml + client.yml (path-filtered)
└── docker-compose.yml           # local Postgres + auto-migrate
```

## Local Setup

You'll need Node 20+ and Docker (or a local Postgres).

```bash
# 1. Database on localhost:5433; schema and seed applied on first boot
docker compose up -d

# 2. API on http://localhost:3001
cd server
cp .env.example .env            # defaults match docker-compose.yml
npm install
npm run dev

# 3. Client on http://localhost:5173 (proxies /api to :3001)
cd client
cp .env.example .env.local      # leave VITE_API_URL blank to use the dev proxy
npm install
npm run dev
```

Without Docker: run `createdb trello_clone`, apply `server/migrations/schema.sql` then `seed.sql` with `psql`, and set `DATABASE_URL` in `server/.env`.

Environment variables:

| Var | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URL` | server | Postgres connection string |
| `PGSSL` | server | `true` for managed Postgres like Neon |
| `CORS_ORIGIN` | server | Allowed browser origins, comma-separated |
| `PORT` | server | API port (local only) |
| `VITE_API_URL` | client | API base URL; blank uses the Vite dev proxy |

## Testing

There are 26 integration tests that run against a real Postgres. They apply the schema and seed in `beforeAll`, which is destructive, so they use a dedicated `trello_clone_test` database rather than your dev one.

```bash
cd server
DATABASE_URL=postgres://postgres:postgres@localhost:5433/trello_clone_test npm test
```

CI runs them on every change under `server/**` using a Postgres service container. The client workflow runs lint, build, and a production-dependency audit on every change under `client/**`.

## Deployment

A push to `main` triggers GitHub Actions (the path-filtered `server.yml` and `client.yml`), and Vercel auto-deploys whichever project changed. Neon serves the data.

- Two Vercel projects point at the same repo: one rooted at `client/` (static SPA) and one at `server/` (serverless Express). Each skips its build when its own directory hasn't changed.
- Neon is reached through its pooled endpoint (PgBouncer). That matters here because serverless spins up many short-lived instances, and the pooler keeps the real connection count in check.
- In production CORS is locked to the frontend origin, and helmet, a 100kb body cap, and a 300 request/minute rate limit are always on.

## Performance Notes

The performance decisions are written down and linked to code in [`.agents/skills/vercel-best-practices/`](.agents/skills/vercel-best-practices/), 16 rules across the stack. A few examples:

- Frontend: deriving values during render instead of syncing them with effects, a `useMemo` for the dimmed-card set, refs for transient drag state, `Set` membership checks, and cleaning up every listener.
- Backend: one aggregate query instead of N+1, the partial index, connection pooling, `FOR UPDATE` for transactional card moves, and a `LIMIT` on search.

## Design Decisions

- Fractional positioning: a reorder is one midpoint `UPDATE`, and the server rebalances only when float precision degrades.
- Optimistic UI with snapshot rollback: instant feedback that still survives a failed request.
- One aggregate board fetch: board, lists, cards, labels, and members in a single round trip using `json_agg` and `array_agg`.
- Raw SQL instead of an ORM: the schema is explicit and easy to explain, and the aggregate fetch plus `FOR UPDATE` moves are awkward to express through an ORM anyway.
- Layered backend: controller, service, repository, so SQL never bleeds into the HTTP layer.
- API versioning: business endpoints sit under `/api/v1/`, while the health check stays unversioned since it's infrastructure.

## Assumptions

- No authentication, per the spec. A default user is assumed, and four sample members are seeded so card assignment works.
- Lists and boards hard-delete (with cascades); cards archive instead, which covers the spec's "delete or archive".
- Labels are scoped to a board, like Trello. Members are global since there are no workspaces or auth.
- Search matches card titles, per the spec. Filters run on the board data that's already loaded, so they don't hit the network.
