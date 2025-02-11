#pragma once

#include <string>
#include <thread>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include "db/database.hpp"

class Server {
public:
    Server(int port);
    ~Server();

    void start();

private:
    int port_;
    int server_fd_;
    Database db_;

    void handle_client(int client_fd);
    
    // Route handlers
    void handle_get_me(int client_fd);
    void handle_login(int client_fd);
    void handle_get_notes(int client_fd, const std::string& query_string, const std::string& user_id);
    void handle_get_note(int client_fd, const std::string& note_id, const std::string& user_id);
    void handle_create_note(int client_fd, const std::string& body, const std::string& user_id);
    void handle_update_note(int client_fd, const std::string& note_id, const std::string& body, const std::string& user_id);
    void handle_delete_note(int client_fd, const std::string& note_id, const std::string& user_id);
    void handle_search_notes(int client_fd, const std::string& query_string, const std::string& user_id);

    // Response helpers
    void send_cors_headers(int client_fd);
    void send_json_response(int client_fd, int status_code, const std::string& body);
    void send_404(int client_fd);
    void send_error(int client_fd, int status_code, const std::string& message);
};
