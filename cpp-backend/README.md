# Wazo Notes C++ Backend

This is a high-performance C++ backend for Wazo Notes that can be compiled and shipped with the Electron frontend.

## Prerequisites

- CMake (>= 3.15)
- C++17 compatible compiler
- vcpkg package manager (recommended for dependencies)

### Required Libraries
- cpprestsdk (for HTTP server)
- nlohmann-json (for JSON handling)
- SQLite3 (for database)

## Building

1. Install dependencies using vcpkg:
```bash
vcpkg install cpprestsdk:x64-osx
vcpkg install nlohmann-json:x64-osx
vcpkg install sqlite3:x64-osx
```

2. Configure and build:
```bash
mkdir build
cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=[path/to/vcpkg]/scripts/buildsystems/vcpkg.cmake
cmake --build .
```

## Running

The server will start on port 3000 by default:
```bash
./build/wazo_backend
```

Or specify a custom port:
```bash
./build/wazo_backend 8080
```

## API Endpoints

- GET /notebooks - List all notebooks
- POST /notebooks - Create a new notebook
- DELETE /notebooks/:id - Delete a notebook

- GET /notes - List all notes in a notebook
- GET /notes/:id - Get a specific note
- POST /notes - Create a new note
- PUT /notes/:id - Update a note
- DELETE /notes/:id - Delete a note

## Integration with Electron

The C++ backend can be integrated with the Electron frontend using node-addon-api or by running it as a separate process and communicating via HTTP.
