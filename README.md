# handsoff-hackathon

Mock pnpm monorepo with a **Vite + React** frontend and a **Fastify** backend, ready to deploy on Vercel.

```
handsoff-hackathon/
├── apps/
│   ├── web/        # Vite + React landing page  (@handsoff/web)
│   └── api/        # Fastify serverless API     (@handsoff/api)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm i -g pnpm`)

## Local development

Install deps from the repo root:

```bash
pnpm install
```

Run both apps in separate terminals:

```bash
pnpm dev:api   # Fastify on http://localhost:3000
pnpm dev:web   # Vite    on http://localhost:5173 (proxies /api -> :3000)
```

Open http://localhost:5173 — the landing page calls `/api/health` to show a live status badge.

## API endpoints

| Method | Path           | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/api/health`  | Liveness check (`{ status, timestamp, service }`) |
| GET    | `/api/content` | Landing page content                 |
| GET    | `/`            | Service info + endpoint list         |

## Deploy on Vercel

This monorepo deploys as **two separate Vercel projects** (one per app). Import the repo at https://vercel.com/new twice:

### 1. API project (`apps/api`)

- **Root Directory:** `apps/api`
- **Framework Preset:** Other
- **Build Command:** `pnpm install --frozen-lockfile` (already in `apps/api/vercel.json`)
- Vercel auto-detects the `api/index.ts` serverless function. `vercel.json` rewrites `/api/*` and `/` to it.

### 2. Web project (`apps/web`)

- **Root Directory:** `apps/web`
- **Framework Preset:** Vite
- **Build Command:** `pnpm install --frozen-lockfile && pnpm build`
- **Output Directory:** `dist`
- **Environment Variable:** set `API_URL` to your deployed API project's URL (e.g. `https://handsoff-api.vercel.app`). The `apps/web/vercel.json` rewrite proxies `/api/:path*` to `${API_URL}/api/:path*`, so the frontend stays same-origin.

> Tip: if you prefer a single project, you can merge `apps/api/api/*` into `apps/web/api/*` and deploy `apps/web` alone — Vercel will serve the SPA and the serverless functions from one URL.

## Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `pnpm dev:web`    | Start Vite dev server                |
| `pnpm dev:api`    | Start Fastify dev server             |
| `pnpm build`      | Typecheck + build both apps          |
| `pnpm build:web`  | Build the frontend                   |
| `pnpm build:api`  | Typecheck the API                    |
