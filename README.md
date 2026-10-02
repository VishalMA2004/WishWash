# WishWash

WishWash helps people choose a rain-free laundry window and understand why the weather is suitable.

## Current implementation

This repository starts the monorepo foundation and a usable weather recommendation dashboard:

- `apps/web`: Next.js App Router, strict TypeScript, responsive dashboard, seven-day forecast, laundry planning dialog, notification permission UX, web manifest and a basic offline service worker.
- `apps/api`: FastAPI weather and plan-evaluation endpoints backed by Open-Meteo and a deterministic drying-window recommendation engine.
- `docker-compose.yml`: local PostgreSQL and Redis services reserved for the persistence and worker phases.

The current app is a foundation, not the complete product in the original product brief. Login, household accounts, persisted plans/history, a database schema/migrations, Redis caching, background monitoring, Web Push delivery, analytics, and deployment automation have not been implemented. The planning/session UI currently holds state in the browser session and does not survive reload. The browser notification button only asks for browser permission; it does not subscribe to a push service. The forecast screen uses a clearly labeled Bengaluru sample coordinate until location settings are implemented.

## Run locally

Requirements: Node.js 20+, Python 3.12+, and optionally Docker Desktop.

To run the web app and API containers with local PostgreSQL and Redis services, use `docker compose up --build`. The database and Redis are not connected to app persistence/background jobs yet; the application currently runs without them. Compose configures PostgreSQL with trust authentication for local development only; do not expose it to an untrusted network.

1. `docker compose up -d db redis`
2. In `apps/api`, create a virtual environment, install `requirements.txt`, then run `uvicorn app.main:app --reload --port 8000`.
3. In the repository root, run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`. FastAPI docs are at `http://localhost:8000/swagger`.

Set `NEXT_PUBLIC_API_URL` when the API is hosted somewhere other than `http://localhost:8000/api/v1`. Use `.env.example` as a reference; do not put secrets in `NEXT_PUBLIC_*` variables.

## Core behavior

The API requests current, daily and hourly weather from Open-Meteo. The recommendation engine considers the full 08:00 onward drying window for a typical outdoor load, including hourly precipitation probability and amount, and estimates drying time using temperature, humidity, wind and solar radiation. The current estimate is a transparent heuristic, not a personalized prediction or a weather safety guarantee.

## Project structure

```text
apps/
  api/app/domain/                 Deterministic recommendation rules
  api/app/infrastructure/         Open-Meteo provider adapter
  api/tests/                      Core recommendation unit tests
  web/app/                        Next.js responsive application
  web/components/                 Shared app components
  web/public/                     PWA manifest assets and service worker
docs/                             Architecture and operations notes
```
