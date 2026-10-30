# DailyD

A fast, login-free daily feed of developer and tech news: engineering blogs
(Java, Spring, Kafka, cloud, AI), big tech newsrooms (Apple, Google, Microsoft,
Samsung, Meta, NVIDIA) and gadget news (phones, laptops, hardware).

- `src/` — React + Vite PWA. Bookmarks, read history and topic preferences are
  kept in this browser only (capped in size; see the Stats tab).
- `backend/` — FastAPI service that aggregates ~125 RSS/Atom feeds every 5
  minutes and serves them from an in-memory, pre-gzipped cache.

## Free hosting cold starts

Render's free plan sleeps after 15 minutes without traffic. Two things soften that:

- `.github/workflows/keep-alive.yml` pings `/health` every 10 minutes so the
  backend stays awake (set the `BACKEND_URL` repository variable if the URL changes).
- If someone still hits a cold server, the app shows the last saved feed (up to
  7 days old) or, with nothing saved, a tiny "Coffee Run" game until the site is ready.

## Run locally

```bash
# backend (http://localhost:8000)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

```bash
# frontend (http://localhost:8080) — reads VITE_API_BASE_URL from .env
npm install
npm run dev
```

## Checks

```bash
npm test            # frontend unit tests
npm run lint
npx tsc -p tsconfig.app.json --noEmit
cd backend && pytest
```

The Content-Security-Policy in `index.html` allows API calls to
`VITE_API_BASE_URL`, so set it in `.env` / `.env.production` per environment.
