# ReportHub API

ReportHub is the system of record for long-running report/data export requests. It prevents duplicate work, tracks lifecycle states, and provides auditability with idempotent writes and optimistic locking.

## Architecture Overview

- **Express + TypeScript** for HTTP APIs and structured request handling.
- **PostgreSQL + Prisma** as the data layer, with a repository pattern isolating all Prisma calls.
- **Zod** for validation.
- **Pino** for structured logging with request IDs.
- **BullMQ + Redis** for async report processing (optional but enabled here).
- **Swagger UI** at `/docs` for interactive API docs.

## Features

- CRUD with soft deletes for `ReportRequest`.
- Strict lifecycle transitions with conflict detection.
- Idempotency keys for safe creates.
- Optimistic locking for updates via `If-Match` version.
- Async processing worker for queued reports.
- OpenAPI docs and integration tests.
- CI workflow with lint, tests, and build.

## Running Locally

1) Start infrastructure:

```bash
docker-compose up -d
```

2) Configure environment:

```bash
cp .env.example .env
```

3) Install deps and run migrations:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

4) Start API:

```bash
npm run dev
```

5) (Optional) Start worker:

```bash
npm run build
npm run worker
```

Swagger UI: `http://localhost:3000/docs`

## Tests

```bash
npm run test
```

## Example cURL Flows

Create a request with idempotency:

```bash
curl -X POST http://localhost:3000/report-requests \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: req-001" \
  -d '{
    "title": "Monthly Sales",
    "type": "SALES_SUMMARY",
    "parameters": { "month": "2025-12" },
    "createdBy": "analyst@example.com"
  }'
```

Queue a report:

```bash
curl -X POST http://localhost:3000/report-requests/{id}/queue
```

Update with optimistic locking:

```bash
curl -X PATCH http://localhost:3000/report-requests/{id} \
  -H "Content-Type: application/json" \
  -H "If-Match: 1" \
  -d '{ "title": "Updated Title" }'
```

List with filters:

```bash
curl "http://localhost:3000/report-requests?status=QUEUED&page=1&pageSize=20"
```

Cancel a request:

```bash
curl -X POST http://localhost:3000/report-requests/{id}/cancel
```

## API Docs

- Swagger UI: `/docs`
- OpenAPI JSON: `/docs.json`

## Project Structure

```
src/
  app.ts
  server.ts
  config/
  lib/
  middlewares/
  modules/reportRequests/
```
