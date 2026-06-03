#!/bin/bash

# FEMS Stop Script
# Stops all backend services and frontend

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}Stopping FEMS Application${NC}"
echo -e "${RED}========================================${NC}"
echo ""

# Kill processes on specific ports
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 5173)
KILLED=0

for PORT in "${PORTS[@]}"; do
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}Killing process on port $PORT (PID: $PID)...${NC}"
        kill -9 $PID 2>/dev/null && echo -e "${GREEN}✓ Stopped service on port $PORT${NC}" || echo -e "${RED}✗ Failed to stop port $PORT${NC}"
        KILLED=1
    fi
done

# Kill any remaining node/npm processes related to FEMS
FEMS_PIDS=$(ps aux | grep -E "npm.*dev|node.*nest|vite" | grep -v grep | awk '{print $2}')
if [ -n "$FEMS_PIDS" ]; then
    echo -e "${YELLOW}Killing remaining FEMS processes...${NC}"
    echo "$FEMS_PIDS" | while read pid; do
        kill -9 $pid 2>/dev/null
    done
    KILLED=1
fi

echo ""
if [ $KILLED -eq 1 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}FEMS Application Stopped${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}To start again, run:${NC} ${YELLOW}./START.sh${NC}"
else
    echo -e "${YELLOW}No FEMS services were running${NC}"
fi
echo ""
