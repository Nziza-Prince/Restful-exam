# FEMS Quick Reference Card 🚀

## 🌐 URLs (Quick Access)

```
Frontend:      http://localhost:5173
API Gateway:   http://localhost:3000
API Docs:      http://localhost:3000/api/docs
Health Check:  http://localhost:3000/api/health
```

## 👤 Login Credentials

```
Admin:     admin@fems.local / Admin@123
Customer:  alice@example.com / Customer@123
```

## 🎮 Essential Commands

### Start Everything
```bash
cd /home/nziza/Documents/code/tests/FEMS

# Start backend (8 services)
npm run dev:services

# In another terminal, start frontend
cd frontend && npm run dev
```

### Stop Everything
```bash
# Stop backend
npm run stop:services

# Stop frontend
pkill -f "vite"
```

### Check Status
```bash
# Test all APIs
npm run test:apis

# Check API Gateway health
curl http://localhost:3000/api/health

# Check PostgreSQL
pg_isready -h localhost -p 5432 -U exam
```

### Database Operations
```bash
# Connect to PostgreSQL
PGPASSWORD=exam psql -h localhost -p 5432 -U exam -d examdb

# Reseed data (safe, idempotent)
npm run seed

# List databases
PGPASSWORD=exam psql -h localhost -p 5432 -U exam -d examdb -c "\l"
```

## 📊 Service Ports

| Service | Port | Status |
|---------|------|--------|
| Frontend | 5173 | ✅ |
| API Gateway | 3000 | ✅ |
| Auth | 3001 | ✅ |
| Customer | 3002 | ✅ |
| Extinguisher | 3003 | ✅ |
| Notification | 3004 | ✅ |
| Renewal | 3005 | ✅ |
| Compliance | 3006 | ✅ |
| Report | 3007 | ✅ |

## 🗃️ Databases

All databases use: `exam:exam@localhost:5432`

- fems_auth
- fems_customers
- fems_extinguishers
- fems_notifications
- fems_renewals
- fems_compliance

## 🔥 Common Tasks

### View Logs
```bash
# If you used the setup script
tail -f services-output.log

# Check individual service
# (logs will be in terminal where services are running)
```

### Test Single Endpoint
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fems.local","password":"Admin@123"}'

# Health check
curl http://localhost:3000/api/health
```

### Find Process on Port
```bash
lsof -i :3000  # API Gateway
lsof -i :5173  # Frontend
```

### Kill Process on Port
```bash
lsof -ti:3000 | xargs kill -9
```

## 🐛 Quick Troubleshooting

### Services Won't Start
```bash
# Rebuild shared package
npm run build:shared

# Try again
npm run dev:services
```

### Database Connection Failed
```bash
# Check Docker stack
cd ~/Documents/code/exam-docker && docker compose ps

# If not running
docker compose up -d

# Test connection
pg_isready -h localhost -p 5432 -U exam
```

### Frontend Shows API Error
1. Check if backend is running: `curl http://localhost:3000/api/health`
2. Check frontend .env: `cat frontend/.env`
3. Should be: `VITE_API_URL=http://localhost:3000/api`

## 📚 Documentation Files

- `PROJECT_STATUS.md` - Complete status report
- `README.md` - Full project documentation
- `SETUP_GUIDE.md` - Setup instructions
- `docs/ARCHITECTURE.md` - System architecture
- `docs/API.md` - API reference
- `docs/DATABASE_DESIGN.md` - Database schema

## 🎯 Test Data Summary

**Users:**
- 1 Admin: admin@fems.local
- 3 Customers: alice@, bob@, carol@example.com

**Extinguishers:**
- 12 total (10 assigned, 2 unassigned)
- Mix of ACTIVE, EXPIRING_SOON, EXPIRED

**Other Data:**
- Notifications with delivery logs
- Sample renewal requests
- Open compliance cases

## 🚨 Emergency Reset

```bash
# Stop everything
npm run stop:services
pkill -f "vite"

# Drop and recreate databases
export PGPASSWORD=exam
for db in auth customers extinguishers notifications renewals compliance; do
  psql -h localhost -p 5432 -U exam -d examdb -c "DROP DATABASE IF EXISTS fems_$db;"
done
psql -h localhost -p 5432 -U exam -d examdb -f scripts/init-databases.sql
unset PGPASSWORD

# Restart services
npm run dev:services

# Wait 30 seconds
sleep 30

# Reseed
npm run seed

# Test
npm run test:apis
```

---

**Status:** ✅ All systems operational  
**Last Updated:** June 3, 2026
