# Deployment

Local services are defined in the root Docker Compose file. Production deployment has not been configured. Before deployment, provide a managed PostgreSQL database, managed Redis if needed, an API container, a web host, TLS, origin allow-list, health monitoring, and environment-specific secrets. Do not use the sample database password from `docker-compose.yml` in production.
