#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Default port
PORT=${1:-3001}

# Find process using the port
PID=$(lsof -t -i:${PORT})

if [ ! -z "$PID" ]; then
    echo -e "${GREEN}==> Found process ${PID} using port ${PORT}${NC}"
    echo -e "${GREEN}==> Killing process...${NC}"
    kill -9 $PID
    echo -e "${GREEN}==> Process killed${NC}"
else
    echo -e "${RED}No process found using port ${PORT}${NC}"
fi
