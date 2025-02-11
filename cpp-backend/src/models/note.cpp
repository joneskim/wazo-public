#include "models/note.hpp"
#include <sstream>
#include <iomanip>
#include <regex>

std::string Note::escape_json(const std::string& str) {
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
            case '#': out += "#"; break;  // Don't escape hash character
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

std::string Note::unescape_json(const std::string& str) {
    std::string out;
    out.reserve(str.length());
    
    for (size_t i = 0; i < str.length(); ++i) {
        if (str[i] == '\\' && i + 1 < str.length()) {
            switch (str[++i]) {
                case '"': out += '"'; break;
                case '\\': out += '\\'; break;
                case '/': out += '/'; break;
                case 'b': out += '\b'; break;
                case 'f': out += '\f'; break;
                case 'n': out += '\n'; break;
                case 'r': out += '\r'; break;
                case 't': out += '\t'; break;
                case 'u':
                    if (i + 4 < str.length()) {
                        std::string hex = str.substr(i + 1, 4);
                        int code = std::stoi(hex, nullptr, 16);
                        out += static_cast<char>(code);
                        i += 4;
                    }
                    break;
                default: out += str[i]; break;
            }
        } else {
            out += str[i];
        }
    }
    
    return out;
}

std::string Note::vector_to_json(const std::vector<std::string>& vec) {
    std::stringstream ss;
    ss << "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        if (i > 0) ss << ",";
        ss << "\"" << escape_json(vec[i]) << "\"";
    }
    ss << "]";
    return ss.str();
}

std::string Note::map_to_json(const std::map<std::string, std::string>& map) {
    std::stringstream ss;
    ss << "{";
    bool first = true;
    for (const auto& [key, value] : map) {
        if (!first) ss << ",";
        ss << "\"" << escape_json(key) << "\":\"" << escape_json(value) << "\"";
        first = false;
    }
    ss << "}";
    return ss.str();
}

std::string BacklinkReference::to_json() const {
    std::stringstream ss;
    ss << "{";
    ss << "\"noteId\":\"" << Note::escape_json(noteId) << "\",";
    ss << "\"context\":\"" << Note::escape_json(context) << "\",";
    ss << "\"timestamp\":\"" << Note::escape_json(timestamp) << "\",";
    ss << "\"relevance\":" << relevance << ",";
    ss << "\"accepted\":" << (accepted ? "true" : "false") << ",";
    ss << "\"rejected\":" << (rejected ? "true" : "false");
    ss << "}";
    return ss.str();
}

std::string Note::backlinks_to_json(const std::vector<BacklinkReference>& backlinks) {
    std::stringstream ss;
    ss << "[";
    for (size_t i = 0; i < backlinks.size(); ++i) {
        if (i > 0) ss << ",";
        ss << backlinks[i].to_json();
    }
    ss << "]";
    return ss.str();
}

std::string Note::to_json() const {
    std::stringstream ss;
    ss << "{";
    ss << "\"id\":\"" << escape_json(id) << "\",";
    ss << "\"content\":\"" << escape_json(content) << "\",";
    ss << "\"created_at\":\"" << escape_json(created_at) << "\",";
    ss << "\"last_modified\":\"" << escape_json(last_modified) << "\",";
    ss << "\"tags\":" << vector_to_json(tags) << ",";
    ss << "\"code_outputs\":" << map_to_json(code_outputs) << ",";
    ss << "\"backlinks\":" << backlinks_to_json(backlinks) << ",";
    ss << "\"references\":" << vector_to_json(references) << ",";
    ss << "\"suggested_links\":" << backlinks_to_json(suggested_links);
    ss << "}";
    return ss.str();
}

BacklinkReference BacklinkReference::from_json(const std::string& json_str) {
    BacklinkReference ref;
    std::regex pattern("\"([^\"]+)\"\\s*:\\s*(?:\"([^\"]*)\"|(true|false|\\d+\\.?\\d*))");
    auto begin = std::sregex_iterator(json_str.begin(), json_str.end(), pattern);
    auto end = std::sregex_iterator();

    for (std::sregex_iterator i = begin; i != end; ++i) {
        std::smatch match = *i;
        std::string key = match[1];
        std::string value = match[2].matched ? match[2] : match[3];
        
        if (key == "noteId") ref.noteId = value;
        else if (key == "context") ref.context = value;
        else if (key == "timestamp") ref.timestamp = value;
        else if (key == "relevance") ref.relevance = std::stod(value);
        else if (key == "accepted") ref.accepted = value == "true";
        else if (key == "rejected") ref.rejected = value == "true";
    }
    
    return ref;
}

Note Note::from_json(const std::string& json_str) {
    Note note;
    std::regex pattern("\"([^\"]+)\"\\s*:\\s*(?:\"([^\"]*)\"|(\\[.*?\\]|\\{.*?\\}|true|false))");
    auto begin = std::sregex_iterator(json_str.begin(), json_str.end(), pattern);
    auto end = std::sregex_iterator();

    for (std::sregex_iterator i = begin; i != end; ++i) {
        std::smatch match = *i;
        std::string key = match[1];
        std::string value = match[2].matched ? unescape_json(match[2]) : match[3];
        
        if (key == "id") note.id = value;
        else if (key == "content") note.content = value;
        else if (key == "created_at") note.created_at = value;
        else if (key == "last_modified") note.last_modified = value;
        else if (key == "tags" && value[0] == '[') {
            // Parse array
            std::regex tag_pattern("\"([^\"]*)\"");
            auto tag_begin = std::sregex_iterator(value.begin(), value.end(), tag_pattern);
            auto tag_end = std::sregex_iterator();
            for (auto it = tag_begin; it != tag_end; ++it) {
                note.tags.push_back(unescape_json((*it)[1]));
            }
        }
        else if (key == "code_outputs" && value[0] == '{') {
            // Parse object
            std::regex output_pattern("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"");
            auto output_begin = std::sregex_iterator(value.begin(), value.end(), output_pattern);
            auto output_end = std::sregex_iterator();
            for (auto it = output_begin; it != output_end; ++it) {
                std::smatch output_match = *it;
                note.code_outputs[output_match[1]] = unescape_json(output_match[2]);
            }
        }
        else if ((key == "backlinks" || key == "suggested_links") && value[0] == '[') {
            // Parse array of backlink references
            std::regex ref_pattern("\\{([^}]+)\\}");
            auto ref_begin = std::sregex_iterator(value.begin(), value.end(), ref_pattern);
            auto ref_end = std::sregex_iterator();
            for (auto it = ref_begin; it != ref_end; ++it) {
                std::smatch ref_match = *it;
                auto ref = BacklinkReference::from_json("{" + ref_match[1].str() + "}");
                if (key == "backlinks") {
                    note.backlinks.push_back(ref);
                } else {
                    note.suggested_links.push_back(ref);
                }
            }
        }
        else if (key == "references" && value[0] == '[') {
            // Parse array
            std::regex ref_pattern("\"([^\"]*)\"");
            auto ref_begin = std::sregex_iterator(value.begin(), value.end(), ref_pattern);
            auto ref_end = std::sregex_iterator();
            for (auto it = ref_begin; it != ref_end; ++it) {
                note.references.push_back(unescape_json((*it)[1]));
            }
        }
    }
    
    return note;
}
