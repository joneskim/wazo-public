#include <iostream>
#include <string>
#include <csignal>
#include "server/server.hpp"

static Server* server_ptr = nullptr;

void signal_handler(int signal) {
    if (server_ptr) {
        std::cout << "\nShutting down server..." << std::endl;
        server_ptr->stop();
    }
    exit(signal);
}

int main(int argc, char* argv[]) {
    try {
        // Default to port 3001 if not specified
        int port = argc > 1 ? std::stoi(argv[1]) : 3001;
        
        std::cout << "Starting server on port " << port << std::endl;
        
        Server server(port);
        server_ptr = &server;

        // Set up signal handling
        signal(SIGINT, signal_handler);
        signal(SIGTERM, signal_handler);
        
        server.start();

        std::cout << "Server is running. Press Ctrl+C to stop." << std::endl;
        
        // Keep main thread alive
        while (true) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
