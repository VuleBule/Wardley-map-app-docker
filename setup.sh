#!/bin/bash

# Color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Wardley Mapping Application...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Please install Docker Desktop for Mac from https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

# Create necessary directories if they don't exist
mkdir -p ./data/db

# Build and start the containers
echo -e "${GREEN}Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for services to be ready
echo -e "${GREEN}Waiting for services to be ready...${NC}"
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Wardley Mapping Application is now running!${NC}"
    echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}🔌 Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}📊 Database: PostgreSQL on port 5432${NC}"
    echo -e "\n${YELLOW}To stop the application, run: ./cleanup.sh${NC}"
else
    echo -e "${YELLOW}Something went wrong. Please check the logs with: docker-compose logs${NC}"
fi
