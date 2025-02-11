#include "models/notebook.hpp"
#include <sstream>
#include <iomanip>
#include <chrono>
#include <regex>

std::string Notebook::escape_json(const std::string& str) {
    std::string out;
    out.reserve(str.length());
    
    for (char c : str) {
        switch (c) {
            case '"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\b': out += "\\b"; break;
            case '\f': out += "\\f"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:
                if ('\x00' <= c && c <= '\x1f') {
                    std::stringstream ss;
                    ss << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(c);
                    out += ss.str();
                } else {
                    out += c;
                }
        }
    }
    
    return out;
}

std::string Notebook::to_json() const {
    std::stringstream ss;
    ss << "{";
    ss << "\"id\":\"" << escape_json(id) << "\",";
    ss << "\"name\":\"" << escape_json(name) << "\",";
    ss << "\"created_at\":\"" << escape_json(created_at) << "\",";
    ss << "\"updated_at\":\"" << escape_json(updated_at) << "\"";
    ss << "}";
    return ss.str();
}

Notebook Notebook::from_json(const std::string& json_str) {
    Notebook notebook;
    
    // Very basic JSON parsing - in a real application, use a proper JSON parser
    std::regex pattern("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"");
    auto begin = std::sregex_iterator(json_str.begin(), json_str.end(), pattern);
    auto end = std::sregex_iterator();

    for (std::sregex_iterator i = begin; i != end; ++i) {
        std::smatch match = *i;
        std::string key = match[1];
        std::string value = match[2];
        
        if (key == "id") notebook.id = value;
        else if (key == "name") notebook.name = value;
        else if (key == "created_at") notebook.created_at = value;
        else if (key == "updated_at") notebook.updated_at = value;
    }

    // Set current time if not provided
    auto now = std::chrono::system_clock::now();
    auto now_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&now_t), "%Y-%m-%d %H:%M:%S");
    
    if (notebook.created_at.empty()) notebook.created_at = ss.str();
    if (notebook.updated_at.empty()) notebook.updated_at = ss.str();
    
    return notebook;
}
