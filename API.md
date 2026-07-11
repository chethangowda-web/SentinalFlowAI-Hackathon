# SentinelFlow API Documentation

## Telemetry
- `POST /api/v1/telemetry/otlp`: Ingest telemetry data (logs, metrics, traces) to trigger the incident pipeline.

## Incidents
- `POST /api/v1/incidents`: Manually create an incident.
- `GET /api/v1/incidents`: Search and list incidents.
- `GET /api/v1/incidents/:id`: Retrieve details for a specific incident.
- `PATCH /api/v1/incidents/:id/status`: Update incident status (e.g., OPEN, IN_PROGRESS, RESOLVED).
- `PATCH /api/v1/incidents/:id/assign`: Assign an incident to an engineer.

## Intelligence & Decisions
- `GET /api/v1/intelligence/dashboard`: Retrieve AI decision intelligence metrics.
- `GET /api/v1/intelligence/decisions/:id`: Get the AI remediation decision for an incident.
- `POST /api/v1/assistant/chat`: Interact with the SRE AI Assistant.

## Runbooks
- `GET /api/v1/runbooks`: List available automated runbooks.
- `POST /api/v1/runbooks/:id/execute`: Trigger a runbook execution manually.

## Platform Health
- `GET /health/live`: Liveness probe.
- `GET /health/ready`: Readiness probe (checks Postgres, Qdrant, Prometheus).
- `GET /metrics`: Prometheus metrics export.

## Demo
- `POST /api/v1/demo/start`: Start simulating production traffic and incidents.
- `POST /api/v1/demo/stop`: Stop the simulation.
