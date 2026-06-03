#!/bin/bash

# FEMS Start Script
# Starts all backend services and frontend

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting FEMS Application${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready -h localhost -p 5432 -U exam > /dev/null 2>&1; then
    echo -e "${YELLOW}PostgreSQL not running. Please start your Docker stack first:${NC}"
    echo -e "  cd ~/Documents/code/exam-docker && docker compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if services are already running
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Services appear to be already running on port 3000${NC}"
    echo -e "If you want to restart, run ${BLUE}./STOP.sh${NC} first"
    exit 1
fi

# Build shared package
echo -e "${YELLOW}Building shared package...${NC}"
npm run build:shared
echo -e "${GREEN}✓ Shared package built${NC}"
echo ""

# Start all services
echo -e "${YELLOW}Starting all backend services and frontend...${NC}"
echo -e "${BLUE}This will start:${NC}"
echo -e "  - API Gateway (port 3000)"
echo -e "  - Auth Service (port 3001)"
echo -e "  - Customer Service (port 3002)"
echo -e "  - Extinguisher Service (port 3003)"
echo -e "  - Notification Service (port 3004)"
echo -e "  - Renewal Service (port 3005)"
echo -e "  - Compliance Service (port 3006)"
echo -e "  - Report Service (port 3007)"
echo -e "  - Frontend (port 5173)"
echo ""

# Start services in background
nohup npm run dev:all > fems-services.log 2>&1 &
SERVICES_PID=$!

echo -e "${GREEN}✓ Services starting in background (PID: $SERVICES_PID)${NC}"
echo -e "${BLUE}Logs: tail -f fems-services.log${NC}"
echo ""

# Wait for services to start
echo -e "${YELLOW}Waiting for services to initialize (30 seconds)...${NC}"
sleep 30

# Check if services are running
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Services are running!${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}FEMS Application Started Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Access Points:${NC}"
    echo -e "  🌐 Frontend:    ${GREEN}http://localhost:5173${NC}"
    echo -e "  📡 API Gateway: ${GREEN}http://localhost:3000${NC}"
    echo -e "  📚 API Docs:    ${GREEN}http://localhost:3000/api/docs${NC}"
    echo ""
    echo -e "${BLUE}Demo Credentials:${NC}"
    echo -e "  Admin:    admin@fems.local / Admin@123"
    echo -e "  Customer: alice@example.com / Customer@123"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  Stop:  ${YELLOW}./STOP.sh${NC}"
    echo -e "  Logs:  ${YELLOW}tail -f fems-services.log${NC}"
    echo -e "  Test:  ${YELLOW}npm run test:apis${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠ Services may not have started properly${NC}"
    echo -e "Check logs: ${BLUE}tail -f fems-services.log${NC}"
    exit 1
fi
