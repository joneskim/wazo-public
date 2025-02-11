#include "db/database.hpp"
#include <stdexcept>
#include <sstream>
#include <uuid/uuid.h>

Database::Database(const std::string& db_name) {
    if (sqlite3_open(db_name.c_str(), &db_) != SQLITE_OK) {
        throw std::runtime_error("Failed to open database: " + std::string(sqlite3_errmsg(db_)));
    }
    init_db();
}

Database::~Database() {
    if (db_) {
        sqlite3_close(db_);
    }
}

void Database::init_db() {
    const char* sql = R"(
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            content TEXT,
            created_at TEXT,
            last_modified TEXT,
            tags TEXT,
            code_outputs TEXT,
            backlinks TEXT,
            references TEXT,
            suggested_links TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_notes_content ON notes(content);
    )";
    
    char* err_msg = nullptr;
    if (sqlite3_exec(db_, sql, nullptr, nullptr, &err_msg) != SQLITE_OK) {
        std::string error = "Failed to create tables: " + std::string(err_msg);
        sqlite3_free(err_msg);
        throw std::runtime_error(error);
    }
}

std::string Database::generate_id() {
    uuid_t uuid;
    uuid_generate(uuid);
    char uuid_str[37];
    uuid_unparse_lower(uuid, uuid_str);
    return std::string(uuid_str);
}

Note Database::note_from_statement(sqlite3_stmt* stmt) {
    Note note;
    note.id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
    note.content = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
    note.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    note.last_modified = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
    
    // Parse tags JSON array
    std::string tags_json = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
    note = Note::from_json(tags_json);
    
    return note;
}

void Database::bind_note_params(sqlite3_stmt* stmt, const Note& note, const std::string& user_id) {
    sqlite3_bind_text(stmt, 1, note.id.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, user_id.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, note.content.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, note.created_at.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 5, note.last_modified.c_str(), -1, SQLITE_STATIC);
    
    std::string json = note.to_json();
    sqlite3_bind_text(stmt, 6, json.c_str(), -1, SQLITE_STATIC);
}

std::vector<Note> Database::get_all_notes(const std::string& user_id) {
    std::vector<Note> notes;
    sqlite3_stmt* stmt;
    const char* sql = "SELECT * FROM notes WHERE user_id = ? ORDER BY last_modified DESC";
    
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        throw std::runtime_error("Failed to prepare statement: " + std::string(sqlite3_errmsg(db_)));
    }
    
    sqlite3_bind_text(stmt, 1, user_id.c_str(), -1, SQLITE_STATIC);
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        notes.push_back(note_from_statement(stmt));
    }
    
    sqlite3_finalize(stmt);
    return notes;
}

std::vector<Note> Database::search_notes(const std::string& query, const std::string& user_id) {
    std::vector<Note> notes;
    sqlite3_stmt* stmt;
    const char* sql = "SELECT * FROM notes WHERE user_id = ? AND content LIKE ? ORDER BY last_modified DESC";
    
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        throw std::runtime_error("Failed to prepare statement: " + std::string(sqlite3_errmsg(db_)));
    }
    
    std::string search_query = "%" + query + "%";
    sqlite3_bind_text(stmt, 1, user_id.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, search_query.c_str(), -1, SQLITE_STATIC);
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        notes.push_back(note_from_statement(stmt));
    }
    
    sqlite3_finalize(stmt);
    return notes;
}

Note Database::get_note(const std::string& id, const std::string& user_id) {
    sqlite3_stmt* stmt;
    const char* sql = "SELECT * FROM notes WHERE id = ? AND user_id = ?";
    
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        throw std::runtime_error("Failed to prepare statement: " + std::string(sqlite3_errmsg(db_)));
    }
    
    sqlite3_bind_text(stmt, 1, id.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, user_id.c_str(), -1, SQLITE_STATIC);
    
    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        throw std::runtime_error("Note not found");
    }
    
    Note note = note_from_statement(stmt);
    sqlite3_finalize(stmt);
    return note;
}

Note Database::create_note(const Note& note, const std::string& user_id) {
    sqlite3_stmt* stmt;
    const char* sql = "INSERT INTO notes (id, user_id, content, created_at, last_modified, tags, code_outputs, backlinks, references, suggested_links) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        throw std::runtime_error("Failed to prepare statement: " + std::string(sqlite3_errmsg(db_)));
    }
    
    Note new_note = note;
    new_note.id = generate_id();
    bind_note_params(stmt, new_note, user_id);
    
    if (sqlite3_step(stmt) != SQLITE_DONE) {
        sqlite3_finalize(stmt);
        throw std::runtime_error("Failed to create note: " + std::string(sqlite3_errmsg(db_)));
    }
    
    sqlite3_finalize(stmt);
    return new_note;
}

Note Database::update_note(const Note& note, const std::string& user_id) {
    sqlite3_stmt* stmt;
    const char* sql = "UPDATE notes SET content = ?, last_modified = ?, tags = ?, code_outputs = ?, backlinks = ?, references = ?, suggested_links = ? WHERE id = ? AND user_id = ?";
    
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        throw std::runtime_error("Failed to prepare statement: " + std::string(sqlite3_errmsg(db_)));
    }
    
    sqlite3_bind_text(stmt, 1, note.content.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, note.last_modified.c_str(), -1, SQLITE_STATIC);
    
    std::string json = note.to_json();
    sqlite3_bind_text(stmt, 3, json.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 8, note.id.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 9, user_id.c_str(), -1, SQLITE_STATIC);
    
    if (sqlite3_step(stmt) != SQLITE_DONE) {
        sqlite3_finalize(stmt);
        throw std::runtime_error("Failed to update note: " + std::string(sqlite3_errmsg(db_)));
    }
    
    sqlite3_finalize(stmt);
    return note;
}

void Database::delete_note(const std::string& id, const std::string& user_id) {
    sqlite3_stmt* stmt;
    const char* sql = "DELETE FROM notes WHERE id = ? AND user_id = ?";
    
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        throw std::runtime_error("Failed to prepare statement: " + std::string(sqlite3_errmsg(db_)));
    }
    
    sqlite3_bind_text(stmt, 1, id.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, user_id.c_str(), -1, SQLITE_STATIC);
    
    if (sqlite3_step(stmt) != SQLITE_DONE) {
        sqlite3_finalize(stmt);
        throw std::runtime_error("Failed to delete note: " + std::string(sqlite3_errmsg(db_)));
    }
    
    sqlite3_finalize(stmt);
}
