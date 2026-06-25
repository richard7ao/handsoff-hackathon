# Buzz — handsoff-hackathon

A physical business describes itself in a 5-minute conversation. **Buzz** researches their market, finds where their customers talk online, writes content in their voice, posts it, and self-improves based on real engagement. Zero human input after intake.

Three agents:

- **Jack** — intake conversation (WhatsApp / Vercel form → structured brief in Supabase)
- **Scout** — long-running research + content (Hermes + Modal, runs 30–45 min unattended)
- **Pulse** — posting + self-improvement (Hermes cron, monitors engagement every 10 min, rewrites when upvotes are low)

This repo is the **marketing landing page** (frontend team), built as a pnpm monorepo and deployed on Vercel.

```
handsoff-hackathon/
├── apps/
│   ├── frontend/   # Vite + React landing page  (@handsoff/frontend)
│   └── backend/    # Fastify serverless API      (@handsoff/backend)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm i -g pnpm`)

## Local development

```bash
pnpm install
```

Run both apps in separate terminals:

```bash
pnpm dev:backend    # Fastify on http://localhost:3000
pnpm dev:frontend   # Vite    on http://localhost:5173 (proxies /api -> :3000)
```

Open http://localhost:5173.

## "Go to Demo" link

The toolbar and footer "Go to Demo" buttons point at `DEMO_URL` in
`apps/frontend/src/App.tsx`. Update that constant to your live hackathon demo URL.

## Design system

Built with [Impeccable](https://impeccable.style/). Brand/visual context lives in
`apps/frontend/PRODUCT.md` and `apps/frontend/DESIGN.md`. Dark "control-room" theme,
environmental green buzz, Geist + Geist Mono.

## API endpoints

| Method | Path           | Description                       |
|--------|----------------|-----------------------------------|
| GET    | `/api/health`  | Liveness (`{ status, timestamp, service }`) — powers the footer status |
| GET    | `/api/content` | Landing copy payload              |
| GET    | `/`            | Service info + endpoint list      |

## Deploy on Vercel

Two separate Vercel projects (import the repo twice at https://vercel.com/new):

### 1. Frontend (`apps/frontend`)

- **Root Directory:** `apps/frontend`
- **Framework Preset:** Vite
- **Build Command:** `pnpm install --frozen-lockfile && pnpm build`
- **Output Directory:** `dist`
- **Env var (optional):** set `API_URL` to the deployed backend URL; `apps/frontend/vercel.json` rewrites `/api/*` to it so the page stays same-origin.

### 2. Backend (`apps/backend`)

- **Root Directory:** `apps/backend`
- **Framework Preset:** Other
- Vercel auto-detects `api/index.ts` as a serverless function; `vercel.json` rewrites `/api/*` and `/` to it.

> Quick path: run `vercel --prod` from `apps/frontend` to get a live URL immediately.

## Scripts

| Command             | Description                  |
|---------------------|------------------------------|
| `pnpm dev:frontend` | Start Vite dev server        |
| `pnpm dev:backend`  | Start Fastify dev server     |
| `pnpm build`        | Typecheck + build both apps  |
| `pnpm build:frontend` | Build the frontend         |
| `pnpm build:backend`  | Typecheck the API          |
