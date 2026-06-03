# FEMS Quick Setup Guide

## Using Your Existing Docker Infrastructure

This guide uses your existing Docker Compose stack at `~/Documents/code/exam-docker`.

### Prerequisites Checklist

- ✅ Node.js 20+ installed
- ✅ PostgreSQL client tools installed (psql, pg_isready)
- ✅ Docker Compose stack at ~/Documents/code/exam-docker
- ✅ Available services:
  - PostgreSQL: localhost:5432 (user: exam, password: exam, database: examdb)
  - Redis: localhost:6379
  - MongoDB: localhost:27017
  - RabbitMQ: localhost:5672

---

## Option 1: Automated Setup (Recommended)

Run the automated setup script that will:
1. Start your Docker Compose stack (if not running)
2. Create FEMS databases
3. Install all dependencies
4. Build shared packages
5. Start all 8 backend services
6. Seed demo data
7. Test APIs
8. Start frontend

```bash
cd /home/nziza/Documents/code/tests/FEMS
./setup-and-run.sh
```

The script will display all access URLs and credentials when complete.

---

## Option 2: Manual Setup (Step by Step)

### Step 1: Start Docker Infrastructure

```bash
cd ~/Documents/code/exam-docker
docker compose up -d
```

Verify PostgreSQL is running:
```bash
pg_isready -h localhost -p 5432 -U exam
```

### Step 2: Create FEMS Databases

```bash
cd /home/nziza/Documents/code/tests/FEMS
export PGPASSWORD=exam
psql -h localhost -p 5432 -U exam -d examdb -f scripts/init-databases.sql
unset PGPASSWORD
```

This creates 6 databases:
- fems_auth
- fems_customers
- fems_extinguishers
- fems_notifications
- fems_renewals
- fems_compliance

### Step 3: Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Step 4: Build Shared Package

```bash
npm run build:shared
```

### Step 5: Start Backend Services

Open a terminal and run:
```bash
npm run dev:services
```

This starts all 8 services:
- API Gateway (port 3000)
- Auth Service (port 3001)
- Customer Service (port 3002)
- Extinguisher Service (port 3003)
- Notification Service (port 3004)
- Renewal Service (port 3005)
- Compliance Service (port 3006)
- Report Service (port 3007)

**Wait 20-30 seconds** for services to initialize and create database tables.

### Step 6: Seed Demo Data

Open a **new terminal** (keep services running):
```bash
cd /home/nziza/Documents/code/tests/FEMS
npm run seed
```

This creates:
- Admin user: admin@fems.local / Admin@123
- Customer users with sample data
- Fire extinguishers
- Notifications and renewal requests

### Step 7: Test APIs (Optional)

Verify all endpoints are working:
```bash
npm run test:apis
```

Expected: All 30+ tests should pass.

### Step 8: Start Frontend

Open another terminal:
```bash
cd /home/nziza/Documents/code/tests/FEMS/frontend
npm run dev
```

---

## Access Points

Once everything is running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React SPA |
| **API Gateway** | http://localhost:3000 | Main API entry point |
| **API Documentation** | http://localhost:3000/api/docs | Swagger UI |
| **Auth Service** | http://localhost:3001 | Direct service access |
| **Customer Service** | http://localhost:3002 | Direct service access |
| **Extinguisher Service** | http://localhost:3003 | Direct service access |
| **Notification Service** | http://localhost:3004 | Direct service access |
| **Renewal Service** | http://localhost:3005 | Direct service access |
| **Compliance Service** | http://localhost:3006 | Direct service access |
| **Report Service** | http://localhost:3007 | Direct service access |

---

## Demo Credentials

### Admin Account
- **Email:** admin@fems.local
- **Password:** Admin@123
- **Capabilities:** Full system access

### Customer Account
- **Email:** alice@example.com
- **Password:** Customer@123
- **Capabilities:** View own extinguishers, submit renewals

---

## Database Configuration

All services are configured to use your existing PostgreSQL instance:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=exam
DB_PASSWORD=exam
```

Each service has its own database:
- Auth Service → fems_auth
- Customer Service → fems_customers
- Extinguisher Service → fems_extinguishers
- Notification Service → fems_notifications
- Renewal Service → fems_renewals
- Compliance Service → fems_compliance

---

## Useful Commands

### Stop All Services
```bash
# Stop backend services
npm run stop:services

# Stop frontend (Ctrl+C in the terminal, or)
pkill -f "vite"
```

### View Service Logs
If you ran automated setup, logs are in `services-output.log`:
```bash
tail -f services-output.log
```

### Restart Individual Service
```bash
# Example: restart auth service
npm run dev:auth --workspace=@fems/auth-service
```

### Reset Database
```bash
# Drop and recreate databases
export PGPASSWORD=exam
psql -h localhost -p 5432 -U exam -d examdb -c "DROP DATABASE IF EXISTS fems_auth;"
psql -h localhost -p 5432 -U exam -d examdb -c "DROP DATABASE IF EXISTS fems_customers;"
psql -h localhost -p 5432 -U exam -d examdb -c "DROP DATABASE IF EXISTS fems_extinguishers;"
psql -h localhost -p 5432 -U exam -d examdb -c "DROP DATABASE IF EXISTS fems_notifications;"
psql -h localhost -p 5432 -U exam -d examdb -c "DROP DATABASE IF EXISTS fems_renewals;"
psql -h localhost -p 5432 -U exam -d examdb -c "DROP DATABASE IF EXISTS fems_compliance;"
psql -h localhost -p 5432 -U exam -d examdb -f scripts/init-databases.sql
unset PGPASSWORD

# Then restart services to recreate tables
npm run stop:services
npm run dev:services

# Reseed data
npm run seed
```

### Test Single Service
```bash
# Example: test auth service
npm test --workspace=@fems/auth-service
```

---

## Troubleshooting

### PostgreSQL Connection Refused
```bash
# Check if Docker stack is running
docker ps

# If not running, start it
cd ~/Documents/code/exam-docker
docker compose up -d

# Wait for PostgreSQL to be ready
pg_isready -h localhost -p 5432 -U exam
```

### Port Already in Use
If you see `EADDRINUSE` error:
```bash
# Find and kill process using the port (e.g., 3000)
lsof -ti:3000 | xargs kill -9

# Or stop all services and restart
npm run stop:services
npm run dev:services
```

### Services Won't Start
1. Check if shared package is built:
   ```bash
   npm run build:shared
   ```

2. Check for TypeScript errors in a service:
   ```bash
   cd services/auth-service
   npm run build
   ```

3. Verify .env files exist and have correct database URLs

### Frontend Shows Connection Error
1. Verify API Gateway is running on port 3000:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Check frontend .env file:
   ```bash
   cat frontend/.env
   # Should contain: VITE_API_URL=http://localhost:3000/api
   ```

### Seeding Fails
Make sure services have been running for at least 20-30 seconds before seeding (TypeORM needs time to create tables).

### Database Already Exists Error
The init script now safely handles existing databases. If you still get errors, you can manually connect and check:
```bash
export PGPASSWORD=exam
psql -h localhost -p 5432 -U exam -d examdb -c "\l"
unset PGPASSWORD
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (:5173)                    │
│         React 19 + TypeScript + Redux Toolkit + Vite        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (:3000)                        │
│          Routes requests to microservices                    │
│          Merged Swagger docs at /api/docs                    │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth (:3001) │  │Customer      │  │Extinguisher  │
│              │  │(:3002)       │  │(:3003)       │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
   fems_auth      fems_customers   fems_extinguishers


┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Notification  │  │Renewal       │  │Compliance    │  │Report        │
│(:3004)       │  │(:3005)       │  │(:3006)       │  │(:3007)       │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
fems_notifications  fems_renewals  fems_compliance    (uses other DBs)


                    PostgreSQL (:5432)
                    user: exam, password: exam
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Redux Toolkit |
| Backend | NestJS 11, TypeORM, Node.js 20+ |
| Database | PostgreSQL 16 (from exam-docker) |
| Auth | JWT + Refresh Tokens, bcrypt, RBAC |
| API Docs | Swagger/OpenAPI |
| Scheduling | @nestjs/schedule (cron jobs) |
| Validation | class-validator, class-transformer |
| Reports | pdfkit, exceljs, fast-csv |

---

## Next Steps

1. **Explore the API**: Visit http://localhost:3000/api/docs
2. **Login**: Use admin@fems.local / Admin@123
3. **Review Documentation**: Check `/docs` folder for detailed guides
4. **Customize**: Modify services in `/services` directory
5. **Add Features**: Each service is independently scalable

---

## Support

For issues or questions:
1. Check service logs: `tail -f services-output.log`
2. Review service-specific logs in each service directory
3. Test individual endpoints using Swagger UI
4. Verify database connectivity with psql

Enjoy building with FEMS! 🚒🔥
