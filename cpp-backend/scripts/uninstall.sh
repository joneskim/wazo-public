#!/bin/bash

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print with color
print_status() {
    echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}Warning:${NC} $1"
}

# Remove binary
if [ -f "/usr/local/bin/wazo_backend" ]; then
    print_status "Removing wazo_backend binary..."
    sudo rm /usr/local/bin/wazo_backend
fi

# Remove build directory
if [ -d "$(pwd)/build" ]; then
    print_status "Removing build directory..."
    rm -rf "$(pwd)/build"
fi

# Optionally remove data
read -p "Do you want to remove all data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "$HOME/.wazo" ]; then
        print_status "Removing data directory..."
        rm -rf "$HOME/.wazo"
    fi
fi

print_status "Uninstallation complete!"
