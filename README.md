# NeedNow

A hyperlocal reverse-bidding marketplace (college project). Requesters post a task, nearby providers bid, the requester compares bids, chats, books one, and reviews the work when it's done.

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4
- **API:** one Vercel function (`api/index.ts`) that routes every `/api/*` request to `server/`
- **Database:** Neon Postgres with Drizzle ORM (`db/schema.ts`, migrations in `drizzle/`)
- **Photos:** Vercel Blob (browser uploads straight to Blob; the DB stores only the URL)
- **Auth:** email + password (PBKDF2), signed tokens (HS256)

## Project layout

```
api/index.ts        Vercel function entry (all /api/* routes)
server/handler.ts   Route table
server/routes/      auth, tasks, bids, chat, misc (stats, providers, helpline), upload
server/auth.ts      Password hashing, tokens, requireUser(role)
server/validate.ts  Input validation (zod)
db/                 Drizzle schema + shared DB client
drizzle/            SQL migrations
scripts/seed.ts     Demo data
tests/api.test.ts   End-to-end API tests
src/                React app (App.tsx, views/, components/, api.ts)
```

## Run locally

Needs Node 22+.

1. `npm install`
2. Create `.env.local` in the repo root:
   ```
   DATABASE_URL=...            # Neon pooled connection string
   DATABASE_URL_UNPOOLED=...   # Neon direct connection string (migrations)
   JWT_SECRET=...              # 64 hex chars: openssl rand -hex 32
   BLOB_READ_WRITE_TOKEN=...   # optional locally; photo upload is off without it
   ```
   With the Neon CLI linked (`neon.ts`), `neon env pull` fills in the database variables.
3. `npm run db:migrate` then `npm run db:seed`. The seed refuses to run on a non-empty database; use `npm run db:seed -- --reset` to wipe and reseed.
4. `npm run dev` and open the URL Vite prints. The API runs inside the Vite dev server, so there's no separate backend to start.

| Script | What it does |
| --- | --- |
| `npm run dev` | App + API with hot reload |
| `npm run build` | Production build of the frontend |
| `npm test` | API tests against the database in `.env.local` (creates and deletes its own users) |
| `npm run db:generate` | New migration after editing `db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Load demo data |
| `npm run db:studio` | Browse the database |

## Demo accounts

All use the password **`Password123`**.

| Role | Email |
| --- | --- |
| Requester | `ananya@example.com` (has a booked task with 3 bids) |
| Requester | `priya@example.com`, `arjun@example.com`, `neha@example.com` |
| Provider | `ravi@example.com`, `meera@example.com`, `sanjay@example.com` |

## Deploy on Vercel

1. Import the GitHub repo as a new Vercel project. The framework is detected from `vercel.json`. Importing deploys the production branch straight away.
2. **Storage → Neon:** connect the existing Neon project, or add `DATABASE_URL` yourself.
3. **Storage → Blob:** create a store and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
4. **Settings → Environment Variables:** add `JWT_SECRET`, using a different value from your local one.
5. Redeploy. Functions run in `sin1` (Singapore), next to the Neon database.

## Rules the API enforces

- Only requesters post tasks. Only providers bid, once per task, and only on open tasks.
- Only the task owner sees its bids, accepts one (once), and completes it (once, rating 1–5).
- Chat is one thread per task and provider. Only the requester and a provider who bid can read or write it.
- Public profiles and task lists never include email or phone.
