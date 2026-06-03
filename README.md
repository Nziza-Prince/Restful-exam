# Fire Extinguisher Management System (FEMS)

Enterprise-grade microservices platform for managing fire extinguisher inventory, expiration tracking, customer notifications, compliance monitoring, and regulatory escalation.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Redux Toolkit, Recharts |
| Backend | NestJS 11, TypeORM, PostgreSQL |
| Auth | JWT + Refresh Token rotation, bcrypt, RBAC |
| API Docs | Swagger (merged at gateway) |
| Scheduling | `@nestjs/schedule` cron jobs |
| Containerization | Docker Compose |

## Architecture

```
React Frontend (:5173 / :8080)
        │
        ▼
API Gateway (:3000)
        │
   ┌────┴────┬──────────┬─────────────┬──────────┬────────────┬──────────┐
   ▼         ▼          ▼             ▼          ▼            ▼          ▼
 Auth    Customer  Extinguisher  Notification  Renewal  Compliance  Report
 :3001    :3002      :3003         :3004       :3005     :3006      :3007
   │         │          │             │          │            │          │
   └─────────┴──────────┴─────────────┴──────────┴────────────┴──────────┘
                              PostgreSQL (6 databases)
```

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm
┌──(nziza㉿nziza)-[~/Documents/code/restful/Restful-Template]
└─$ cd apps/frontend               
                                                                                                                                                                                                                     
┌──(nziza㉿nziza)-[~/…/restful/Restful-Template/apps/frontend]
└─$ npm install   
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@10.3.10: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
⠸



### 1. Install dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Create databases

PostgreSQL must be running. If `psql` fails with **Connection refused**, check your port — many local installs use **5433** instead of 5432 (this project’s sibling KParking setup does too).

```bash
# Default port (5432)
psql -U postgres -f scripts/init-databases.sql

# If PostgreSQL listens on 5433 (common on Windows)
psql -U postgres -p 5433 -f scripts/init-databases.sql
```

**Windows (full path, port 5433):**

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -p 5433 -f scripts/init-databases.sql
```

After creating databases, each service `.env` uses port **5433** (see `.env.example`). Adjust the password if yours is not `postgres` or `12345`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5433/fems_auth
```

### 3. Configure environment

Copy `.env.example` to `.env` in each service and the frontend:

```bash
cp services/auth-service/.env.example services/auth-service/.env
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/customer-service/.env.example services/customer-service/.env
cp services/extinguisher-service/.env.example services/extinguisher-service/.env
cp services/notification-service/.env.example services/notification-service/.env
cp services/renewal-service/.env.example services/renewal-service/.env
cp services/compliance-service/.env.example services/compliance-service/.env
cp services/report-service/.env.example services/report-service/.env
cp frontend/.env.example frontend/.env
```

**Windows (PowerShell):**

```powershell
Copy-Item services\auth-service\.env.example services\auth-service\.env
Copy-Item services\api-gateway\.env.example services\api-gateway\.env
Copy-Item services\customer-service\.env.example services\customer-service\.env
Copy-Item services\extinguisher-service\.env.example services\extinguisher-service\.env
Copy-Item services\notification-service\.env.example services\notification-service\.env
Copy-Item services\renewal-service\.env.example services\renewal-service\.env
Copy-Item services\compliance-service\.env.example services\compliance-service\.env
Copy-Item services\report-service\.env.example services\report-service\.env
Copy-Item frontend\.env.example frontend\.env
```

### 4. Start all backend services

```bash
npm run build:shared
npm run dev:services
```

If you see **`EADDRINUSE`** (port already in use), stop leftover processes and restart:

```bash
npm run stop:services
npm run dev:services
```

### 5. Seed demo data

**Start backend services first** (TypeORM creates tables on startup), then seed:

```bash
npm run dev:services
```

In a **second terminal**, from the **project root** (not `frontend/`), once services are running:

```bash
cd "C:\Users\admin\Desktop\Templates\Restful practical\FireExtinguisherManagement"
npm run seed
```

### 6. Test all APIs (before frontend)

With **all 8 backend services** running (`npm run dev:services` — ports 3000–3007):

```bash
npm run test:apis
```

If report tests fail with **502**, report-service (port **3007**) is not running. Restart everything:

```bash
npm run dev:services
```

All 30 gateway endpoints should pass. Then start the frontend.

### 7. Start frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fems.local | Admin@123 |
| Customer | alice@example.com | Customer@123 |

## Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| API Gateway | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Customer registration |
| POST | `/api/auth/refresh` | Refresh tokens |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/users/me` | Current user |
| CRUD | `/api/customers` | Customer management |
| CRUD | `/api/extinguishers` | Extinguisher management |
| GET | `/api/notifications` | Notification center |
| CRUD | `/api/renewals` | Renewal requests |
| GET | `/api/compliance/cases` | Compliance cases |
| GET | `/api/reports/*` | Reports (PDF/XLSX/CSV) |
| GET | `/api/reports/dashboard-summary` | Dashboard charts |

Full documentation: http://localhost:3000/api/docs

## User Roles

**Admin** — Full access: customers, extinguishers, notifications, renewals, compliance, reports, settings.

**Customer** — View own extinguishers, notifications, submit renewal requests.

## Business Rules

- **Pre-expiry alerts** at 90, 60, 30, and 7 days before expiration
- **Post-expiry workflow**: Day 0 alert → Day 15 reminder → Day 30 warning → Day 60 escalation
- Notifications sent via email (SMS-ready architecture)
- Compliance cases escalate to authorities after configurable period

## Project Structure

```
├── packages/shared/       # @fems/shared — guards, DTOs, bootstrap
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── customer-service/
│   ├── extinguisher-service/
│   ├── notification-service/
│   ├── renewal-service/
│   ├── compliance-service/
│   └── report-service/
├── frontend/              # React SPA
├── scripts/               # DB init + seed
├── docs/                  # Architecture, API, deployment
└── docker/                # Dockerfiles
```

## Testing

```bash
# Backend unit tests
npm test --workspace=@fems/auth-service

# Frontend tests
cd frontend && npm test
```

## Documentation

- [System Guide (for newcomers)](docs/SYSTEM_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

Proprietary — Fire Extinguisher Management System
