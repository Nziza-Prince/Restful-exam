# FEMS Start/Stop Guide

## Quick Commands

### Start Everything
```bash
cd /home/nziza/Documents/code/tests/FEMS
./START.sh
```

### Stop Everything
```bash
cd /home/nziza/Documents/code/tests/FEMS
./STOP.sh
```

---

## Manual Start (if scripts don't work)

### Step 1: Ensure Docker is Running
```bash
# Check if PostgreSQL is accessible
pg_isready -h localhost -p 5432 -U exam

# If not, start Docker stack
cd ~/Documents/code/exam-docker && docker compose up -d
```

### Step 2: Build Shared Package (First Time Only)
```bash
cd /home/nziza/Documents/code/tests/FEMS
npm run build:shared
```

### Step 3: Start All Services
```bash
# Start backend + frontend together
npm run dev:all

# OR start separately:
# Terminal 1 - Backend
npm run dev:services

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## Manual Stop

### Option 1: Kill by Port (Recommended)
```bash
# Kill each service port
lsof -ti:3000 | xargs kill -9  # API Gateway
lsof -ti:3001 | xargs kill -9  # Auth
lsof -ti:3002 | xargs kill -9  # Customer
lsof -ti:3003 | xargs kill -9  # Extinguisher
lsof -ti:3004 | xargs kill -9  # Notification
lsof -ti:3005 | xargs kill -9  # Renewal
lsof -ti:3006 | xargs kill -9  # Compliance
lsof -ti:3007 | xargs kill -9  # Report
lsof -ti:5173 | xargs kill -9  # Frontend
```

### Option 2: Kill by Process Name
```bash
# Kill all node processes related to FEMS
pkill -f "npm.*dev"
pkill -f "nest start"
pkill -f "vite"
```

### Option 3: Find and Kill Main Process
```bash
# Find the main npm process
ps aux | grep "npm run dev:all"

# Kill it (replace XXXX with actual PID)
kill -9 XXXX

# Or kill all npm/node processes
pkill -9 npm
pkill -9 node
```

---

## Check Running Status

### Check All Ports
```bash
lsof -i :3000-3007,5173
```

### Check Specific Service
```bash
# Check if API Gateway is running
curl http://localhost:3000/api/health

# Expected output:
# {"status":"ok","gateway":true,"services":[...]}
```

### Check Frontend
```bash
# Check if frontend is accessible
curl http://localhost:5173

# Should return HTML
```

---

## After Desktop Shutdown/Restart

When your desktop shuts down unexpectedly, all Node.js processes are terminated automatically. To restart:

### Quick Restart
```bash
# 1. Check Docker is running
docker ps

# If not running:
cd ~/Documents/code/exam-docker && docker compose up -d

# 2. Wait for PostgreSQL
sleep 5
pg_isready -h localhost -p 5432 -U exam

# 3. Start FEMS
cd /home/nziza/Documents/code/tests/FEMS
./START.sh
```

---

## Troubleshooting

### Services Won't Start
```bash
# 1. Ensure no services are already running
./STOP.sh

# 2. Clear any stuck processes
pkill -9 node
pkill -9 npm

# 3. Check PostgreSQL
pg_isready -h localhost -p 5432 -U exam

# 4. Rebuild shared package
npm run build:shared

# 5. Try starting again
./START.sh
```

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000

# Kill it
lsof -ti:3000 | xargs kill -9

# Or kill all
./STOP.sh
```

### Frontend Won't Start (Permission Error)
```bash
cd frontend
chmod +x node_modules/.bin/vite
cd ..
./START.sh
```

---

## VS Code Terminal Running Services

If you started services in VS Code terminal and can't find them:

### Option 1: Use Terminal Panel
1. Press ``Ctrl+` `` (backtick) to open terminal
2. Look for running npm processes
3. Press `Ctrl+C` to stop

### Option 2: Kill from Outside VS Code
```bash
# From a regular terminal (not in VS Code)
cd /home/nziza/Documents/code/tests/FEMS
./STOP.sh
```

### Option 3: Close VS Code
- Closing VS Code will terminate all terminal processes
- Then start fresh using `./START.sh`

---

## Checking Service Health

### Test All APIs
```bash
cd /home/nziza/Documents/code/tests/FEMS
npm run test:apis

# Should show: 28/28 passed
```

### Manual API Test
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fems.local","password":"Admin@123"}'

# Should return JWT tokens
```

---

## View Logs

### Real-time Logs (if using START.sh)
```bash
tail -f fems-services.log
```

### View Service Output (if run manually)
- Services output will be in the terminal where you ran them
- Press `Ctrl+C` to stop viewing (will also stop services)

---

## Common Scenarios

### Scenario 1: Computer Crashed
```bash
# After reboot
cd ~/Documents/code/exam-docker && docker compose up -d
sleep 10
cd ~/Documents/code/tests/FEMS
./START.sh
```

### Scenario 2: Need to Make Code Changes
```bash
# Stop services
./STOP.sh

# Make your changes
# ...

# Restart
./START.sh
```

### Scenario 3: Database Connection Error
```bash
# Check Docker
docker ps | grep postgres

# If not running
cd ~/Documents/code/exam-docker && docker compose up -d

# Test connection
PGPASSWORD=exam psql -h localhost -p 5432 -U exam -d examdb -c "SELECT 1"

# Restart FEMS
cd ~/Documents/code/tests/FEMS
./START.sh
```

---

## Production Deployment (Future)

For production, you would:

1. **Use PM2** for process management
   ```bash
   npm install -g pm2
   pm2 start npm --name "fems-services" -- run dev:services
   pm2 start npm --name "fems-frontend" --cwd frontend -- run dev
   pm2 save
   pm2 startup
   ```

2. **Use Docker Compose** for everything
   - Already have `docker-compose.yml`
   - Run: `docker compose up -d`

3. **Use Nginx** for reverse proxy
   - Point domain to your server
   - Configure SSL certificates

---

## Summary

| Task | Command |
|------|---------|
| **Start Everything** | `./START.sh` |
| **Stop Everything** | `./STOP.sh` |
| **Check Status** | `lsof -i :3000-3007,5173` |
| **Test APIs** | `npm run test:apis` |
| **View Logs** | `tail -f fems-services.log` |
| **Kill All** | `pkill -9 node && pkill -9 npm` |
| **Restart After Crash** | `docker compose up -d` then `./START.sh` |

---

**Remember**: 
- Always ensure Docker/PostgreSQL is running first
- Use `./START.sh` and `./STOP.sh` for easiest management
- After unexpected shutdown, just run `./START.sh` again
- Check logs if something goes wrong: `tail -f fems-services.log`
