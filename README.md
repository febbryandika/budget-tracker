# Budget Tracker

Personal finance app — log income and expenses, browse monthly summaries with charts, and get AI-generated spending insights. **Invitation-only**: there is no public sign-up; an admin provisions every account.

- **Frontend**: React 19 · Vite · TanStack Router/Query · TailwindCSS v4 · Recharts
- **Backend**: Hono on Bun · better-auth (+ admin plugin) · Drizzle ORM · OpenAI SDK
- **Database**: Neon PostgreSQL
- **Hosting**: Cloudflare Pages (frontend) · Cloudflare Workers (backend)

See [`SPEC.md`](./SPEC.md) for the full product spec and [`CLAUDE.md`](./CLAUDE.md) for architecture details.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0 (the package manager **and** runtime — do not use npm/pnpm/yarn)
- A Neon Postgres database (free tier works)
- Optional: OpenAI API key for the AI Insights feature; Upstash Redis for distributed rate limits

## Setup

```bash
# 1. Install
bun install

# 2. Configure env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET (openssl rand -base64 32),
# and the SUPERUSER_* values you want the first admin account to use.

# 3. Apply the schema
cd backend && bun run db:push

# 4. Provision the super-admin (reads SUPERUSER_* from backend/.env)
bun run bootstrap:admin

# 5. Run everything
cd .. && bun run dev
```

Frontend on `http://localhost:5173`, backend on `http://localhost:3000`. Sign in at `/login` with the SUPERUSER credentials; the **Admin** link in the top nav opens `/admin` where you can create, edit, reset passwords, and delete users.

## Scripts

Run from repo root unless noted.

| Command | Description |
| --- | --- |
| `bun run dev` | Backend + frontend concurrently |
| `bun run dev:backend` / `dev:frontend` | One at a time |
| `bun run test` | Backend + frontend unit/component tests |
| `bun run typecheck` | Frontend type check |
| `bun run build` | Frontend production build |
| `bun run test:e2e` | Playwright E2E suite (auto-starts both servers) |
| `bun run test:e2e:ui` | Playwright UI mode |
| `bun run test:e2e:install` | One-time: download Chromium |

Backend-only (run inside `backend/`):

| Command | Description |
| --- | --- |
| `bun run db:generate` | Generate a Drizzle migration from `schema.ts` |
| `bun run db:migrate` | Apply migrations |
| `bun run db:push` | Push schema directly (dev shortcut) |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run bootstrap:admin` | Idempotently create / promote the super-admin from `SUPERUSER_*` env |
| `bun run deploy` | `wrangler deploy` |

## Project layout

```
budget-tracker/
├── backend/                  # Hono on Bun (deploys to Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts          # Hono app, chained .route() calls, exports AppType
│   │   ├── routes/           # admin, categories, entries, summary, insights
│   │   ├── lib/              # auth, middleware (requireAuth/requireAdmin), rate-limit, ...
│   │   └── db/               # Drizzle schema + lazy client
│   ├── scripts/
│   │   └── bootstrap-admin.ts
│   ├── drizzle/              # Generated migrations + snapshots
│   └── wrangler.toml
├── frontend/                 # React 19 + Vite (deploys to Cloudflare Pages)
│   └── src/
│       ├── routes/           # TanStack file-based routing (admin, dashboard, entries, ...)
│       ├── components/       # app/, auth/, categories/, dashboard/, entries/, landing/, ui/
│       └── lib/              # auth-client (better-auth + adminClient), client (Hono RPC), ...
├── e2e/                      # Playwright tests
├── CLAUDE.md                 # Architecture, conventions, gotchas
├── SPEC.md                   # Product spec
└── playwright.config.ts
```

## Admin & user management

Public sign-up is disabled (`emailAndPassword.disableSignUp: true` + better-auth `admin()` plugin). To add new users:

- **Super-admin** comes from `bun run bootstrap:admin`, which reads `SUPERUSER_EMAIL` / `SUPERUSER_NAME` / `SUPERUSER_PASSWORD` and creates or promotes that account. Idempotent — safe to re-run.
- **Everyone else** is created from the in-app `/admin` page by any user with `role === 'admin'`. The same page handles edits, password resets, and deletions. Admins cannot delete themselves.

The backend admin routes live at `backend/src/routes/admin.ts` and are gated by `requireAdmin` (in `backend/src/lib/middleware.ts`). Client-side calls go through `authClient.admin.*` (the `adminClient()` plugin in `frontend/src/lib/auth-client.ts`) or the typed Hono RPC client.

## Environment variables

### `backend/.env`

| Var | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon Postgres connection string |
| `BETTER_AUTH_SECRET` | yes | 32-byte secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | yes | Backend base URL (e.g. `http://localhost:3000`) |
| `FRONTEND_URL` | yes | Used for CORS and `trustedOrigins` |
| `PORT` | dev | Backend port (default 3000) |
| `SUPERUSER_EMAIL` / `SUPERUSER_NAME` / `SUPERUSER_PASSWORD` | bootstrap | Consumed by `bootstrap:admin` only |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | for AI insights | OpenAI access; defaults to `gpt-4.1-nano` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | optional | Distributed rate-limit counters; falls back to in-memory |
| `SENTRY_DSN` | optional | Backend Sentry reporting |

### `frontend/.env`

| Var | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | yes | Backend URL the Hono RPC client targets |
| `VITE_SENTRY_DSN` | optional | Frontend Sentry reporting |

## Deployment

### Backend → Cloudflare Workers

```bash
# One-time secrets (values are not retrievable later — keep your own copy)
cd backend
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL          # https://<worker-subdomain>.workers.dev
wrangler secret put OPENAI_API_KEY           # if using AI insights
wrangler secret put UPSTASH_REDIS_REST_URL   # optional
wrangler secret put UPSTASH_REDIS_REST_TOKEN # optional

bun run deploy
```

Non-secret config (`FRONTEND_URL`, `OPENAI_MODEL`, `NODE_ENV`) lives in `wrangler.toml` under `[vars]`.

### Frontend → Cloudflare Pages

Build command: `bun run build` · Output directory: `frontend/dist` · Env: `VITE_API_URL` pointing at the Workers URL.

### Provision the prod admin (one-time)

`wrangler` can't execute arbitrary scripts inside the Worker, so the bootstrap runs locally against the prod database:

```bash
cd backend
DATABASE_URL='postgresql://...prod...' \
BETTER_AUTH_SECRET='<your prod secret>' \
SUPERUSER_EMAIL='you@example.com' \
SUPERUSER_NAME='Your Name' \
SUPERUSER_PASSWORD='a-strong-password' \
bun run scripts/bootstrap-admin.ts
```

(Invoke the script directly rather than `bun run bootstrap:admin`, which would force-load `backend/.env`.) Idempotent — re-run any time.

## Testing

- **Backend** (`cd backend && bun run test`) — Vitest against an in-memory PGlite database via the setup in `src/test/`.
- **Frontend** (`cd frontend && bun run test`) — Vitest + Testing Library for components and lib utilities.
- **E2E** (`bun run test:e2e`) — Playwright. `e2e/global-setup.ts` seeds the test admin via the bootstrap script (`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`, defaults `e2e-admin@test.local`); per-test users are then provisioned through the admin API.

## License

Private / personal use.
