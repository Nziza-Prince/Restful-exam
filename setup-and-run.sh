#!/bin/bash

# FEMS Complete Setup and Run Script
# This script sets up and runs the Fire Extinguisher Management System

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# Step 1: Check Docker infrastructure
log_section "Step 1: Checking Docker Infrastructure"
log_info "Checking if Docker Compose stack is running..."

# Check if PostgreSQL is accessible
if ! pg_isready -h localhost -p 5432 -U exam > /dev/null 2>&1; then
    log_warning "PostgreSQL is not accessible on localhost:5432"
    log_info "Starting Docker Compose stack..."
    
    if [ -d ~/Documents/code/exam-docker ]; then
        cd ~/Documents/code/exam-docker
        docker compose up -d
        cd - > /dev/null
        
        log_info "Waiting for PostgreSQL to be ready..."
        sleep 5
        
        # Wait for PostgreSQL to be ready
        for i in {1..30}; do
            if pg_isready -h localhost -p 5432 -U exam > /dev/null 2>&1; then
                log_success "PostgreSQL is ready!"
                break
            fi
            echo -n "."
            sleep 1
        done
        echo ""
    else
        log_error "Docker directory not found: ~/Documents/code/exam-docker"
        log_info "Please start your Docker Compose stack manually:"
        log_info "  cd ~/Documents/code/exam-docker && docker compose up -d"
        exit 1
    fi
else
    log_success "PostgreSQL is accessible!"
fi

# Step 2: Initialize databases
log_section "Step 2: Initializing Databases"
log_info "Creating FEMS databases..."

export PGPASSWORD=exam
psql -h localhost -p 5432 -U exam -d examdb -f scripts/init-databases.sql

if [ $? -eq 0 ]; then
    log_success "Databases created successfully!"
else
    log_error "Database creation failed. Trying with postgres user..."
    unset PGPASSWORD
    export PGPASSWORD=exam
    psql -h localhost -p 5432 -U postgres -f scripts/init-databases.sql || {
        log_error "Failed to create databases. Please check your PostgreSQL setup."
        exit 1
    }
fi
unset PGPASSWORD

# Step 3: Install dependencies
log_section "Step 3: Installing Dependencies"

if [ ! -d "node_modules" ]; then
    log_info "Installing root dependencies..."
    npm install
else
    log_success "Root dependencies already installed"
fi

if [ ! -d "frontend/node_modules" ]; then
    log_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
else
    log_success "Frontend dependencies already installed"
fi

# Step 4: Build shared package
log_section "Step 4: Building Shared Package"
log_info "Building @fems/shared..."
npm run build:shared
log_success "Shared package built!"

# Step 5: Start backend services
log_section "Step 5: Starting Backend Services"
log_info "Starting all 8 backend services (Gateway + 7 microservices)..."
log_info "Services will run on ports 3000-3007"
log_info ""
log_info "Services:"
log_info "  - API Gateway:        http://localhost:3000"
log_info "  - Auth Service:       http://localhost:3001"
log_info "  - Customer Service:   http://localhost:3002"
log_info "  - Extinguisher:       http://localhost:3003"
log_info "  - Notification:       http://localhost:3004"
log_info "  - Renewal Service:    http://localhost:3005"
log_info "  - Compliance Service: http://localhost:3006"
log_info "  - Report Service:     http://localhost:3007"
log_info ""
log_info "Starting services in the background..."

# Start services in background and redirect output to log file
npm run dev:services > services-output.log 2>&1 &
SERVICES_PID=$!

log_info "Services starting with PID: $SERVICES_PID"
log_info "Waiting for services to initialize (30 seconds)..."
sleep 30

# Check if services are running
if ps -p $SERVICES_PID > /dev/null; then
    log_success "Backend services are running!"
    log_info "View logs with: tail -f services-output.log"
else
    log_error "Services failed to start. Check services-output.log for details."
    exit 1
fi

# Step 6: Seed database
log_section "Step 6: Seeding Database with Demo Data"
log_info "Seeding demo users and data..."
sleep 5  # Give services more time to create tables
npm run seed

if [ $? -eq 0 ]; then
    log_success "Database seeded successfully!"
else
    log_warning "Seeding encountered issues. Check the output above."
fi

# Step 7: Test APIs
log_section "Step 7: Testing API Endpoints"
log_info "Running API tests..."
npm run test:apis

# Step 8: Start frontend
log_section "Step 8: Starting Frontend"
log_info "Starting React frontend on http://localhost:5173"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

log_info "Frontend starting with PID: $FRONTEND_PID"
sleep 5

# Final summary
log_section "🎉 FEMS Setup Complete!"
echo ""
log_success "All services are running!"
echo ""
echo -e "${GREEN}Access Points:${NC}"
echo -e "  🌐 Frontend:      ${BLUE}http://localhost:5173${NC}"
echo -e "  📡 API Gateway:   ${BLUE}http://localhost:3000${NC}"
echo -e "  📚 API Docs:      ${BLUE}http://localhost:3000/api/docs${NC}"
echo ""
echo -e "${GREEN}Demo Credentials:${NC}"
echo -e "  👤 Admin:    ${YELLOW}admin@fems.local${NC} / ${YELLOW}Admin@123${NC}"
echo -e "  👤 Customer: ${YELLOW}alice@example.com${NC} / ${YELLOW}Customer@123${NC}"
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo -e "  📋 View backend logs:  ${BLUE}tail -f services-output.log${NC}"
echo -e "  🛑 Stop all services:  ${BLUE}npm run stop:services && pkill -f 'vite'${NC}"
echo -e "  🧪 Test APIs:          ${BLUE}npm run test:apis${NC}"
echo ""
log_info "Press Ctrl+C to stop monitoring. Services will continue running in background."
echo ""

# Keep script running and show logs
tail -f services-output.log
