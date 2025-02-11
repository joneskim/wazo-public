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

print_error() {
    echo -e "${RED}Error:${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please modify for other platforms."
    exit 1
fi

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    print_status "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check for cmake
if ! command -v cmake &> /dev/null; then
    print_status "Installing CMake..."
    brew install cmake
fi

# Install SQLite3
if ! brew list sqlite3 &>/dev/null; then
    print_status "Installing SQLite3..."
    brew install sqlite3
fi

# Get SQLite3 installation path from brew
SQLITE3_ROOT=$(brew --prefix sqlite3)
print_status "SQLite3 installed at: ${SQLITE3_ROOT}"

# Create build directory
BUILD_DIR="$(pwd)/build"
if [ ! -d "$BUILD_DIR" ]; then
    mkdir -p "$BUILD_DIR"
fi

# Configure and build
print_status "Configuring project..."
cd "$BUILD_DIR"
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DSQLite3_INCLUDE_DIRS="${SQLITE3_ROOT}/include" \
    -DSQLite3_LIBRARIES="${SQLITE3_ROOT}/lib/libsqlite3.dylib"

print_status "Building project..."
cmake --build . --config Release -j$(sysctl -n hw.ncpu)

# Create symbolic links
print_status "Installing..."
if [ ! -d "/usr/local/bin" ]; then
    sudo mkdir -p /usr/local/bin
fi

BINARY_PATH="$BUILD_DIR/wazo_backend"
if [ -f "$BINARY_PATH" ]; then
    sudo ln -sf "$BINARY_PATH" /usr/local/bin/wazo_backend
    print_status "Installation complete! You can now run 'wazo_backend' from anywhere."
else
    print_error "Build failed: Binary not found"
    exit 1
fi

# Create data directory
DATA_DIR="$HOME/.wazo"
if [ ! -d "$DATA_DIR" ]; then
    mkdir -p "$DATA_DIR"
    print_status "Created data directory at $DATA_DIR"
fi

print_status "Build and installation completed successfully!"
echo ""
echo "You can now:"
echo "1. Run 'wazo_backend' to start the server"
echo "2. Access the API at http://localhost:3000"
echo "3. Data is stored in $DATA_DIR"
echo ""
print_warning "Make sure to update your Electron app to point to the new backend!"
