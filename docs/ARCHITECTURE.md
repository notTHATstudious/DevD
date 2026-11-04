# DailyD — Architecture & Tech Stack

DailyD is a login-free daily feed of developer and tech news. A small Python
server collects ~165 public RSS/Atom feeds; a React web app shows, filters and
searches them. Personal data (bookmarks, reading history, preferences) never
leaves the visitor's browser.

## How it works

```
 Public RSS/Atom feeds (~125)          Visitor's browser
        │  every 5 min                 ┌──────────────────────────────┐
        ▼                              │ React app (static files)     │
 ┌─────────────────────────┐  JSON     │  • feed, filters, search     │
 │ FastAPI backend         │◀─────────▶│  • assistant (search chat)   │
 │  • fetch + clean feeds  │  HTTPS    │  • Coffee Run mini game      │
 │  • in-memory cache      │           │  • contact form              │
 │  • search index         │           │ localStorage: bookmarks,     │
 │  • contact form → SQLite│           │ read history, topics, theme  │
 └─────────────────────────┘           └──────────────────────────────┘
        │ (optional) SMTP
        ▼
   Owner's inbox
```

1. On start, the backend fetches all feeds (first pass waits max 4 s so it can
   answer quickly), cleans them (HTML stripped, only `https` links, duplicates
   removed, topics tagged) and keeps the newest 2,000 articles in memory.
2. Every 5 minutes it refreshes in the background. Each refresh also rebuilds
   the search index and a pre-compressed copy of the article list.
3. The web app downloads that list once (~330 KB compressed), then does
   filtering, ranking and feed search locally. Only the assistant search and
   the contact form call the server again.

## Tracks & stacks

On the first visit the app asks "What do you build?": **Backend**, **Frontend**
or **Full-stack** (both sides), then which stacks. Skipping picks Backend.
Saved in the browser as `dailyd_profile`; changeable in Topics.

| Track | Stacks |
|---|---|
| Backend | Java · Spring Boot, Python · FastAPI, Node.js · NestJS, Go, C# · .NET |
| Frontend | React · Next.js, Angular, Vue · Nuxt, Svelte, Web basics (HTML/CSS/TypeScript) |
| Full-stack | Any mix of the above |

Rules (`src/lib/stacks.ts`): articles that belong only to stacks you didn't pick
are hidden; shared topics (cloud, AI, security, big tech) and untagged articles
stay; your stacks rank first; the assistant boosts your stacks' topics.
Stack-specific feeds tag every post via the `topics` field in
`backend/app/adapters/rss/feed_sources.py`.

## Tech stack

### Frontend (`src/`)
| What | Used for |
|---|---|
| React 18 + TypeScript 5 | UI |
| Vite 5 | Dev server and production build |
| Tailwind CSS 3 (+ tailwindcss-animate) | Styling, light/dark theme |
| TanStack React Query 5 | Loading/caching the feed, retries |
| TanStack React Virtual 3 | Only renders cards near the screen |
| lucide-react | Icons |
| Radix UI toast/tooltip, sonner | Small UI notifications |
| Vitest + Testing Library + jsdom | Tests |
| ESLint + typescript-eslint | Linting |

The app is installable as a PWA (`public/manifest.webmanifest`).

### Backend (`backend/`)
| What | Used for |
|---|---|
| Python 3.11+ | Runtime (Docker image uses 3.11) |
| FastAPI + Starlette | HTTP API |
| Uvicorn | Server |
| Pydantic / pydantic-settings | Request validation, config from env vars |
| httpx | Fetching feeds (async, redirects, size cap) |
| SQLite (Python stdlib) | Contact form messages |
| smtplib (Python stdlib) | Optional: forward contact messages by email |
| pytest + pytest-asyncio | Tests |

No database server, no paid or third-party APIs, no analytics.

### Tooling & hosting today
- GitHub (`notTHATstudious/DevD`), GitHub Actions keep-alive ping (`.github/workflows/keep-alive.yml`)
- Backend on Render (free plan), frontend on a static host

## API

| Method | Path | Purpose | Limits |
|---|---|---|---|
| GET | `/health` | Health check | — |
| GET | `/` | Service info | — |
| GET | `/api/v1/articles` | Full cached feed (gzip + ETag) | 300 req/min/IP |
| POST | `/api/v1/devd-assistant/search` | Ranked search (`query`, `limit`, `offset`) | 60 req/min/IP |
| POST | `/api/v1/contact` | Contact form | 5 per 15 min/IP, 200/day total |

## Configuration (environment variables)

| Variable | Default | Notes |
|---|---|---|
| `APP_ENV` | `development` | Set `production` on the server (enables HSTS header) |
| `DEBUG` | `false` | `true` shows API docs at `/docs` — never in production |
| `CORS_ORIGINS` | `["*"]` | Set to your site, e.g. `["https://dailyd.example"]` |
| `CACHE_REFRESH_SECONDS` | `300` | Feed refresh interval |
| `COLD_START_DEADLINE_SECONDS` | `4` | First fetch after boot waits this long |
| `BACKGROUND_REFRESH` | `true` | Tests set `false` |
| `CONTACT_DB_PATH` | `backend/data/messages.db` | Put on a persistent disk |
| `CONTACT_RETENTION_DAYS` | `365` | Older messages are deleted |
| `CONTACT_DAILY_LIMIT` | `200` | Spam-flood cap |
| `CONTACT_EMAIL_TO`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | unset | Optional email forwarding; keep these secret |

Frontend: `VITE_API_BASE_URL` in `.env` (local) and `.env.production` (build).

## Folder map

```
src/
  api/            HTTP calls (articles, assistant, contact)
  components/     UI pieces (ArticleList, FloatingAssistant, CoffeeRun, LegalFooter, ContactForm…)
  lib/            Logic: storage, search, ranking, categories, game, snapshot
  pages/          Index (main screen), NotFound
  test/           Frontend tests
backend/app/
  adapters/rss/   Feed list and RSS/Atom parser
  api/v1/         Endpoints (articles, assistant, contact, health)
  core/           Logging, errors, security middleware
  services/       Feed aggregation, cache, search, contact storage
  messages.py     `python -m app.messages` — read contact messages
backend/tests/    Backend tests
docs/             This documentation
```

## Data stored where

| Data | Where | Kept |
|---|---|---|
| Bookmarks (≤300), read history (≤1,000, 90 days), topics, theme, game best score, feed snapshot (100 articles, 7 days) | Visitor's browser (localStorage, ~100–400 KB) | Until cleared |
| Articles | Server memory | Replaced every 5 min |
| Contact messages (+ optional name/email) | Server SQLite file | 12 months |
| IP addresses | Server memory only, for rate limiting | Minutes; never written to disk by the app |
