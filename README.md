<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-Vite-3178C6?logo=typescript&logoColor=white" alt="TypeScript + Vite">
  <img src="https://img.shields.io/badge/AI-Gemini-8E75B2?logo=googlegemini&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/status-private-lightgrey" alt="status: private">
</p>

# Adorable

**An open-source take on Lovable: describe a React app in plain English and watch it get built and previewed live.**

You type what you want ("a pomodoro timer with a dark theme"), Gemini writes the
files, and an in-browser Sandpack preview runs the result next to a Monaco code
editor. Keep chatting to change it.

- **Instant mode** for quick edits, **Plan mode** for bigger builds that the AI
  breaks into phases.
- Multi-file projects saved to Postgres, so you can come back to them.
- The AI sees the preview's console output and corrects its own errors.

## Quick start

```sh
npm install
npm run server:install      # server/ has its own package.json
cp .env.example .env        # then fill in the keys below
npm run server:migrate      # create the Postgres tables
npm run dev:all             # Vite front end + API server together
```

Other scripts: `npm run dev` (front end only), `npm run dev:server` (API only),
`npm run build`, `npm run lint`, `npm run preview`.

## Configuration

Front end (`.env`):

- `VITE_API_URL` — base URL of the API server (defaults to `http://localhost:3002`).
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` — listed in `.env.example` for the Supabase client.

API server (`server/`):

- `DATABASE_URL` — Postgres connection string for saved projects.
- `GEMINI_API_KEY` — Google Gemini key used for code generation.
- `PORT` — port the API listens on (defaults to `3001`; set it to match `VITE_API_URL`).

Supabase edge function `generate-vibe` reads `GEMINI_API_KEY` from its function secrets.

## How it works

```
browser (React + Sandpack + Monaco)
   │  prompt + current files + console output
   ▼
server/index.js (Express)  ──►  Gemini  ──►  generated files (JSON)
   │
   ▼
Postgres (projects, files)
```

`supabase/functions/generate-vibe` is an alternative Deno edge-function version
of the generation step.

## More

- [AI_SETUP_GUIDE.md](AI_SETUP_GUIDE.md) — full project orientation for agents
- [USAGE_GUIDE.md](USAGE_GUIDE.md) — utility and component reference
- [DEPLOYMENT.md](DEPLOYMENT.md) — deploying the edge function
