# FEMS Architecture

## Overview

The Fire Extinguisher Management System (FEMS) uses a microservices architecture with an API gateway, shared library, and dedicated PostgreSQL database per bounded context.

## Services

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| api-gateway | 3000 | — | Reverse proxy, merged Swagger |
| auth-service | 3001 | fems_auth | Authentication, users, audit logs |
| customer-service | 3002 | fems_customers | Customer CRUD |
| extinguisher-service | 3003 | fems_extinguishers | Extinguisher inventory, status cron |
| notification-service | 3004 | fems_notifications | Alerts, email/SMS, delivery logs |
| renewal-service | 3005 | fems_renewals | Service/replacement requests |
| compliance-service | 3006 | fems_compliance | Compliance cases, escalation |
| report-service | 3007 | — | Aggregated reports and exports |

## Identity Model

Users (`fems_auth.users`) and customers (`fems_customers.customers`) are linked by **email** at runtime. No cross-database foreign keys.

1. Admin creates customer record with email
2. Customer registers with matching email → `users` row created
3. Services resolve `customer_id` via internal API: `GET /internal/customers/by-email/:email`

## Internal Communication

Service-to-service calls use `X-Service-Key` header (`SERVICE_INTERNAL_KEY` env var).

```
extinguisher-service ──► notification-service  POST /internal/notifications/trigger
notification-service ──► compliance-service   POST /internal/compliance/escalate
renewal-service      ──► extinguisher-service PATCH /internal/extinguishers/:id/renew
report-service       ──► all services         GET internal report endpoints
```

## Cron Jobs

| Service | Schedule | Action |
|---------|----------|--------|
| extinguisher-service | Daily | Update statuses, trigger notifications |
| notification-service | Daily | Process pending email deliveries |
| compliance-service | Daily | Scan for day-60 escalations |

## Shared Package (@fems/shared)

- `bootstrapService()` — Helmet, CORS, ValidationPipe, Swagger
- JWT guards and RBAC (`RolesGuard`, `@Roles()`)
- `ServiceAuthGuard` for internal routes
- `createTypeOrmConfig()` for PostgreSQL
- Pagination helpers

## Frontend

React SPA with Redux Toolkit state management, role-based routing, and Axios interceptors for JWT refresh.

## Security

- bcrypt password hashing (cost 12)
- JWT access tokens (15m) + refresh token rotation (7 days)
- Rate limiting via `@nestjs/throttler`
- Helmet security headers
- CORS restricted to frontend origin
