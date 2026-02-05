## AI Agent Portal

Netlify-based AI Agent Portal where users can:

- **Register / login** with JWT auth (Netlify Functions)
- **Manage a draggable, resizable widget layout** (text/chart/weather/custom)
- **Persist portal settings** (layout, theme, language) in **PostgreSQL** via TypeORM
- **Control the portal via an AI agent Function** (`/.netlify/functions/ai-agent-command`) that can:
  - Change theme to dark/light
  - Add a welcome widget
  - Make all widgets fullscreen

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL instance (Supabase, Railway, Render, etc.)
- Netlify CLI (for local simulation) – `npm install -g netlify-cli` (optional but recommended)

### 2. Netlify Functions backend (PostgreSQL + TypeORM)

Environment variables (in `.env` locally, and in Netlify UI for deploy):

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `TYPEORM_SYNC` (optional, set to `true` only in development)

Local setup from repo root:

```bash
cp .env.example .env        # create and fill DB / JWT values if you add this file
npm install                 # install root deps (Netlify Functions, TypeORM, etc.)
npm run build:functions     # optional: type-check functions
```

Key Functions (HTTP endpoints on Netlify):

- `POST /.netlify/functions/auth-register`
- `POST /.netlify/functions/auth-login`
- `GET  /.netlify/functions/user-settings-get`
- `PUT  /.netlify/functions/user-settings-put`
- `POST /.netlify/functions/ai-agent-command`

### 3. Frontend setup (Vue 3 + Vuetify + Pinia)

```bash
cd frontend
cp .env.example .env    # keep default VITE_API_URL=/.netlify/functions for Netlify
npm install
npm run dev             # Vite dev server (defaults to http://localhost:5173)
```

In production on Netlify, `netlify.toml` builds the frontend with:

- `command = "cd frontend && npm run build"`
- `publish = "frontend/dist"`
- `functions = "netlify/functions"`

### 4. Running everything locally with Netlify CLI

From the repo root:

```bash
npm install          # root deps (once)
cd frontend && npm install   # frontend deps (once)
cd ..
netlify dev          # serves frontend + Functions on a single dev URL
```

### 5. Notes

- JWTs are expected in `Authorization: Bearer <token>`.
- Portal layout and theme are stored in the `portal_settings` table (JSONB layout).
- AI agent logic is currently **rule-based** in `ai-agent-command` Function; you can replace it with real LLM calls.
