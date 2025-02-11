#include "server/server.hpp"
#include "models/note.hpp"
#include "db/database.hpp"
#include <sstream>
#include <chrono>
#include <thread>
#include <regex>
#include <uuid/uuid.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

Server::Server(int port) : port_(port), db_("notes.db") {
    // Initialize server socket
    server_fd_ = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd_ < 0) {
        throw std::runtime_error("Failed to create socket");
    }

    // Set socket options
    int opt = 1;
    if (setsockopt(server_fd_, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt))) {
        throw std::runtime_error("Failed to set socket options");
    }

    // Bind socket to port
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port_);

    if (bind(server_fd_, (struct sockaddr *)&address, sizeof(address)) < 0) {
        throw std::runtime_error("Failed to bind to port");
    }
}

Server::~Server() {
    if (server_fd_ >= 0) {
        close(server_fd_);
    }
}

void Server::start() {
    if (listen(server_fd_, 3) < 0) {
        throw std::runtime_error("Failed to listen");
    }

    std::cout << "Server listening on port " << port_ << std::endl;

    while (true) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        
        int client_fd = accept(server_fd_, (struct sockaddr *)&client_addr, &client_len);
        if (client_fd < 0) {
            std::cerr << "Failed to accept connection" << std::endl;
            continue;
        }

        // Handle client in a new thread
        std::thread([this, client_fd]() {
            handle_client(client_fd);
            close(client_fd);
        }).detach();
    }
}

void Server::handle_client(int client_fd) {
    char buffer[30000] = {0};
    ssize_t bytes_read = read(client_fd, buffer, sizeof(buffer));
    
    if (bytes_read <= 0) {
        return;
    }

    // Parse HTTP request
    std::string request(buffer);
    std::string method = request.substr(0, request.find(' '));
    std::string path = request.substr(request.find(' ') + 1);
    path = path.substr(0, path.find(' '));

    // Parse query parameters
    std::string query_string;
    if (path.find('?') != std::string::npos) {
        query_string = path.substr(path.find('?') + 1);
        path = path.substr(0, path.find('?'));
    }

    // Parse request body
    std::string body;
    size_t body_pos = request.find("\r\n\r\n");
    if (body_pos != std::string::npos) {
        body = request.substr(body_pos + 4);
    }

    // Handle CORS preflight request
    if (method == "OPTIONS") {
        send_cors_headers(client_fd);
        return;
    }

    try {
        // Extract user ID from Authorization header (mock authentication)
        std::string user_id = "mock-user-id";

        // Handle routes
        if (path == "/api/auth/me") {
            handle_get_me(client_fd);
        }
        else if (path == "/api/auth/login") {
            handle_login(client_fd);
        }
        else if (path == "/api/notes" && method == "GET") {
            handle_get_notes(client_fd, query_string, user_id);
        }
        else if (path == "/api/notes" && method == "POST") {
            handle_create_note(client_fd, body, user_id);
        }
        else if (path.find("/api/notes/") == 0 && method == "GET") {
            std::string note_id = path.substr(11);
            handle_get_note(client_fd, note_id, user_id);
        }
        else if (path.find("/api/notes/") == 0 && method == "PUT") {
            std::string note_id = path.substr(11);
            handle_update_note(client_fd, note_id, body, user_id);
        }
        else if (path.find("/api/notes/") == 0 && method == "DELETE") {
            std::string note_id = path.substr(11);
            handle_delete_note(client_fd, note_id, user_id);
        }
        else if (path == "/api/notes/search" && method == "GET") {
            handle_search_notes(client_fd, query_string, user_id);
        }
        else {
            send_404(client_fd);
        }
    }
    catch (const std::exception& e) {
        send_error(client_fd, 500, e.what());
    }
}

void Server::handle_get_me(int client_fd) {
    json response = {
        {"id", "mock-user-id"},
        {"email", "user@example.com"},
        {"name", "Mock User"}
    };
    
    send_json_response(client_fd, 200, response.dump());
}

void Server::handle_login(int client_fd) {
    json response = {
        {"success", true},
        {"token", "mock-token"}
    };
    
    send_json_response(client_fd, 200, response.dump());
}

void Server::handle_get_notes(int client_fd, const std::string& query_string, const std::string& user_id) {
    // Parse query parameters
    std::string query;
    int page = 1;
    int page_size = 20;
    
    std::regex param_regex("([^=&]+)=([^&]+)");
    auto params_begin = std::sregex_iterator(query_string.begin(), query_string.end(), param_regex);
    auto params_end = std::sregex_iterator();
    
    for (std::sregex_iterator i = params_begin; i != params_end; ++i) {
        std::smatch match = *i;
        std::string key = match[1];
        std::string value = match[2];
        
        if (key == "query") query = value;
        else if (key == "page") page = std::stoi(value);
        else if (key == "pageSize") page_size = std::stoi(value);
    }
    
    // Get notes from database
    std::vector<Note> notes;
    if (!query.empty()) {
        notes = db_.search_notes(query, user_id);
    } else {
        notes = db_.get_all_notes(user_id);
    }
    
    // Apply pagination
    int start_index = (page - 1) * page_size;
    int end_index = std::min(start_index + page_size, static_cast<int>(notes.size()));
    
    json response = {
        {"notes", json::array()},
        {"total", notes.size()},
        {"currentPage", page},
        {"totalPages", (notes.size() + page_size - 1) / page_size}
    };
    
    for (int i = start_index; i < end_index; i++) {
        response["notes"].push_back(json::parse(notes[i].to_json()));
    }
    
    send_json_response(client_fd, 200, response.dump());
}

void Server::handle_get_note(int client_fd, const std::string& note_id, const std::string& user_id) {
    try {
        Note note = db_.get_note(note_id, user_id);
        send_json_response(client_fd, 200, note.to_json());
    }
    catch (const std::runtime_error& e) {
        send_error(client_fd, 404, "Note not found");
    }
}

void Server::handle_create_note(int client_fd, const std::string& body, const std::string& user_id) {
    try {
        Note note = Note::from_json(body);
        Note created_note = db_.create_note(note, user_id);
        send_json_response(client_fd, 201, created_note.to_json());
    }
    catch (const std::exception& e) {
        send_error(client_fd, 400, "Invalid note data");
    }
}

void Server::handle_update_note(int client_fd, const std::string& note_id, const std::string& body, const std::string& user_id) {
    try {
        Note note = Note::from_json(body);
        note.id = note_id;
        Note updated_note = db_.update_note(note, user_id);
        send_json_response(client_fd, 200, updated_note.to_json());
    }
    catch (const std::runtime_error& e) {
        if (std::string(e.what()).find("not found") != std::string::npos) {
            send_error(client_fd, 404, "Note not found");
        } else {
            send_error(client_fd, 400, "Invalid note data");
        }
    }
}

void Server::handle_delete_note(int client_fd, const std::string& note_id, const std::string& user_id) {
    try {
        db_.delete_note(note_id, user_id);
        send_json_response(client_fd, 204, "");
    }
    catch (const std::runtime_error& e) {
        send_error(client_fd, 404, "Note not found");
    }
}

void Server::handle_search_notes(int client_fd, const std::string& query_string, const std::string& user_id) {
    // Parse query parameter
    std::string query;
    std::regex param_regex("query=([^&]+)");
    std::smatch match;
    if (std::regex_search(query_string, match, param_regex)) {
        query = match[1];
    }
    
    if (query.empty()) {
        send_error(client_fd, 400, "Query parameter is required");
        return;
    }
    
    std::vector<Note> notes = db_.search_notes(query, user_id);
    
    json response = {
        {"notes", json::array()},
        {"total", notes.size()}
    };
    
    for (const auto& note : notes) {
        response["notes"].push_back(json::parse(note.to_json()));
    }
    
    send_json_response(client_fd, 200, response.dump());
}

void Server::send_cors_headers(int client_fd) {
    std::string response = "HTTP/1.1 204 No Content\r\n";
    response += "Access-Control-Allow-Origin: *\r\n";
    response += "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
    response += "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
    response += "Access-Control-Allow-Credentials: true\r\n";
    response += "\r\n";
    
    send(client_fd, response.c_str(), response.length(), 0);
}

void Server::send_json_response(int client_fd, int status_code, const std::string& body) {
    std::string status_text;
    switch (status_code) {
        case 200: status_text = "OK"; break;
        case 201: status_text = "Created"; break;
        case 204: status_text = "No Content"; break;
        case 400: status_text = "Bad Request"; break;
        case 404: status_text = "Not Found"; break;
        case 500: status_text = "Internal Server Error"; break;
        default: status_text = "Unknown"; break;
    }
    
    std::stringstream response;
    response << "HTTP/1.1 " << status_code << " " << status_text << "\r\n";
    response << "Content-Type: application/json\r\n";
    response << "Access-Control-Allow-Origin: *\r\n";
    response << "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
    response << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
    response << "Access-Control-Allow-Credentials: true\r\n";
    
    if (!body.empty()) {
        response << "Content-Length: " << body.length() << "\r\n";
    }
    
    response << "\r\n";
    
    if (!body.empty()) {
        response << body;
    }
    
    send(client_fd, response.str().c_str(), response.str().length(), 0);
}

void Server::send_404(int client_fd) {
    send_error(client_fd, 404, "Not Found");
}

void Server::send_error(int client_fd, int status_code, const std::string& message) {
    json error = {
        {"error", message}
    };
    send_json_response(client_fd, status_code, error.dump());
}
