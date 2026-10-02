# API

Base path: `/api/v1`. Interactive OpenAPI documentation: `/swagger`; ReDoc: `/redoc`; schema: `/openapi.json`.

## `GET /weather/forecast`

Query parameters: `latitude` (-90..90), `longitude` (-180..180), optional `location` (display label).

Returns `{ "success": true, "data": { "location", "updated_at", "current", "days" } }`. A provider outage returns HTTP 503 and `{ "success": false, "error": { "code": "WEATHER_PROVIDER_UNAVAILABLE", "message": "Weather information is temporarily unavailable." } }`.

## `POST /recommendations/evaluate`

Accepts `latitude`, `longitude`, `date` (`YYYY-MM-DD`), `start_time` (`HH:MM`), and `category`. It evaluates the chosen start hour and a category-adjusted drying duration against hourly forecast data. Dates outside the available forecast return a structured `FORECAST_UNAVAILABLE` error; the user may still proceed with their plan.

## `GET /health`

Returns an API liveness response. This does not check database, Redis, or background workers.
