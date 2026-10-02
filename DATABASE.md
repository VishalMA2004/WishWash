# Database

PostgreSQL and Redis services are defined in Docker Compose, but no entities, repository, schema, or Alembic migrations have been added yet. Planned first persistent aggregates are user preferences, laundry plans, laundry sessions, weather snapshots, notification preferences, and wash outcome events. Persist UTC timestamps and retain a user's IANA timezone for local scheduling and display.
