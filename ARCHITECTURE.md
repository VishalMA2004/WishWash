# Architecture

## Current request path

```text
Next.js dashboard
    -> GET /api/v1/weather/forecast
        -> OpenMeteoProvider adapter
            -> Open-Meteo Forecast API
        -> normalized weather response
        -> deterministic domain recommendation rules
```

The provider adapter owns external HTTP and provider response handling. `app/domain/recommendations.py` owns drying time and recommendation decisions. FastAPI validates coordinates, translates provider failures into a stable error response, and publishes generated OpenAPI docs.

## Planned application layers

As account and laundry data are added, keep routes as transport adapters and place use cases in application services. Domain entities should not depend on FastAPI, SQLAlchemy, Redis, or an external weather vendor. Repositories, weather providers, push delivery, and caches belong behind infrastructure interfaces.

PostgreSQL and Redis are provisioned locally for upcoming phases, but the current application does not persist user or laundry data and does not start a worker.
