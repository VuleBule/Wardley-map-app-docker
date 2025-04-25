#!/bin/bash

# Color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Wardley Mapping Application...${NC}"

# Stop containers
docker-compose down

echo -e "${GREEN}Containers stopped successfully.${NC}"

# Ask if user wants to remove volumes (database data)
read -p "Do you want to remove all data (database volumes)? (y/N): " remove_volumes

if [[ "$remove_volumes" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Removing all data...${NC}"
    docker-compose down -v
    echo -e "${GREEN}All data removed.${NC}"
else
    echo -e "${GREEN}Data preserved. You can restart the application with ./setup.sh${NC}"
fi

# Check if any related containers are still running
if docker ps | grep -q "personal-website"; then
    echo -e "${YELLOW}Some containers are still running. You may need to stop them manually:${NC}"
    docker ps | grep "personal-website"
fi

echo -e "${GREEN}Cleanup complete!${NC}"
