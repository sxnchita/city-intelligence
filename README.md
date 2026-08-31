# City Intelligence — ANPR Dashboard

The operator-facing frontend for the ANPR trajectory and traffic analytics backend.
Six screens over one REST API: a live map, vehicle search, traffic, alerts, analytics
and camera health.

## Running it

Two processes. The backend serves the API on **:8000**; this dev server runs on **:5173**
and proxies `/api` to it, so the browser only ever talks to one origin and CORS never
arises. **Open http://localhost:5173.**

### 1. Backend

```bash
cd ../../Backend
docker compose up --build -d
until curl -sf localhost:8000/actuator/health >/dev/null; do sleep 2; done
```

If port 5432 is already taken on your machine, override it — nothing inside the
containers changes:

```bash
DB_PORT=55432 docker compose up -d
```

### 2. Seed some data

**A fresh backend has no traffic in it.** Flyway creates the schema and loads the camera
set, but every analytics endpoint returns zeros until vehicles have been generated and
resolved into identities. An empty dashboard usually means this step was skipped.

```bash
# ~2 hours of history, produced in about 8 seconds
curl -X POST localhost:8000/api/sim/backfill -H 'Content-Type: application/json' \
  -d '{"hours": 2, "congestionFactor": 2.6}'

# Resolve identities in time order, then rebuild the analytics aggregates
curl -X POST localhost:8000/api/identity/rebuild

# Live traffic, so the SSE feed has something to push
curl -X POST localhost:8000/api/sim/start -H 'Content-Type: application/json' \
  -d '{"vehiclesPerMinute": 30, "ocrErrorRate": 0, "nullPlateRate": 0}'
```

### 3. Frontend

```bash
npm install
npm run dev
```

## Live vs demo

Every page tries the real API first and falls back to bundled fixtures when it cannot
reach it. Each screen carries a badge in its header — **Live** or **Demo data** — so it
is never ambiguous which one is on screen. Stop the backend and reload: the app keeps
working, and every badge flips to Demo.

The fixtures satisfy exactly the same TypeScript types as the live responses, so a drift
in the API contract breaks the build rather than quietly breaking the fallback.

## The app is not tied to a city

`GET /api/cameras` returns `camera_set`, `bbox`, `center` and `suggested_zoom` alongside
the camera features, and the map frames itself from those. Point the backend at a
different camera set and the map, the zone filters and the analytics all move with it —
no frontend change. The demo fixtures are a Delhi network and carry the same envelope;
the backend ships Chandigarh.

## What each screen calls

| Screen | Endpoints |
| --- | --- |
| Dashboard | `/api/analytics/summary`, `/api/alerts`, `/api/events/recent`, `/api/cameras` |
| Vehicle Search | `/api/trajectory?plate=` |
| Traffic | `/api/analytics/congestion` |
| Alerts | `/api/alerts` + live `/api/stream` |
| Analytics | `/api/analytics/summary`, `/api/analytics/density`, `/api/analytics/od`, `/api/analytics/congestion` |
| Camera Health | `/api/cameras` |
| Map (all screens) | `/api/cameras`, `/api/vehicles/{id}/trajectory`, `/api/analytics/heatmap`, `/api/stream` |

Two things the API guarantees that this frontend relies on:

- **Named SSE events.** `/api/stream` sends `event: sighting` and `event: alert`, so the
  client uses `addEventListener`, not `onmessage` — `onmessage` never fires for named
  events.
- **Honest geometry.** Trajectory hops carry `geometry_source: "road" | "straight_line"`
  and are always marked `inferred`, because the road between two cameras is never
  observed. The map does not re-route live data; `routingService.ts` snaps only the demo
  fixtures, which are straight lines by construction.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | *(empty)* | Prefix for API calls. Empty means same-origin, which is what the dev proxy wants. Set it only to bypass the proxy. |
| `VITE_BACKEND_ORIGIN` | `http://localhost:8000` | Where the dev server proxies `/api` and `/actuator`. |

## Scripts

```bash
npm run dev       # dev server on :5173, proxying to the backend
npm run build     # typecheck (tsc -b) then production build
npm run lint      # oxlint
npm run preview   # serve the production build
```

`npm run build` typechecks; `npm run dev` does not. Run the build before pushing.
