#pragma once

#include <string>

struct Notebook {
    std::string id;
    std::string name;
    std::string created_at;
    std::string updated_at;

    // JSON conversion
    std::string to_json() const;
    static Notebook from_json(const std::string& json_str);
    
    // Helper function to escape JSON strings
    static std::string escape_json(const std::string& str);
};
