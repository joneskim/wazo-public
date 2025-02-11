cmake_minimum_required(VERSION 3.15)
project(wazo_backend)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find SQLite3
find_package(SQLite3 REQUIRED)

# Add source files
add_executable(wazo_backend
    src/main.cpp
    src/server/server.cpp
    src/db/database.cpp
    src/models/note.cpp
    src/models/notebook.cpp
)

# Include directories
target_include_directories(wazo_backend PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${SQLite3_INCLUDE_DIRS}
)

# Link libraries
target_link_libraries(wazo_backend PRIVATE
    ${SQLite3_LIBRARIES}
)
