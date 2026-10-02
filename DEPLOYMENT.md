# Deployment

## Vercel multi-service project

The root `vercel.json` configures two services in one Vercel project:

- `api` is the FastAPI service rooted at `apps/api` and is publicly routed under `/api/*`.
- `web` is the Next.js service rooted at `apps/web` and receives all other public paths.

The API's `/api/v1` endpoints and OpenAPI documentation paths are already under `/api`, matching Vercel's service rewrite. Vercel passes the original request path through the rewrite, so `/api/v1/weather/forecast` remains `/api/v1/weather/forecast` at FastAPI. The frontend uses the relative `/api/v1` URL by default, keeping browser requests same-origin. `NEXT_PUBLIC_API_URL` remains available as a local development override; do not set it to a service binding URL in Vercel.

There are no service bindings because the web app calls the API from the browser through the public same-origin `/api/*` route, and the API calls its external weather provider directly. If server-side service-to-service calls are added later, declare a binding on the calling service and read its injected environment variable at runtime.

Configure environment variables and secrets in Vercel for the relevant service. Do not use the sample database password from `docker-compose.yml` in production. Local services remain defined in the root Docker Compose file; use `vercel dev` to exercise the Vercel service routing locally.
