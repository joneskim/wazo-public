#pragma once

#include <string>
#include <vector>
#include <sqlite3.h>
#include "models/note.hpp"

class Database {
public:
    Database(const std::string& db_name);
    ~Database();

    // Note operations
    std::vector<Note> get_all_notes(const std::string& user_id);
    std::vector<Note> search_notes(const std::string& query, const std::string& user_id);
    Note get_note(const std::string& id, const std::string& user_id);
    Note create_note(const Note& note, const std::string& user_id);
    Note update_note(const Note& note, const std::string& user_id);
    void delete_note(const std::string& id, const std::string& user_id);

private:
    sqlite3* db_;
    void init_db();
    std::string generate_id();
    
    // Helper functions
    Note note_from_statement(sqlite3_stmt* stmt);
    void bind_note_params(sqlite3_stmt* stmt, const Note& note, const std::string& user_id);
};
