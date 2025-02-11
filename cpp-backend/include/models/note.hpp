#pragma once

#include <string>
#include <vector>
#include <map>

struct BacklinkReference {
    std::string noteId;
    std::string context;
    std::string timestamp;
    double relevance;
    bool accepted;
    bool rejected;

    std::string to_json() const;
    static BacklinkReference from_json(const std::string& json_str);
};

class Note {
public:
    std::string id;
    std::string content;
    std::string created_at;
    std::string last_modified;
    std::vector<std::string> tags;
    std::map<std::string, std::string> code_outputs;
    std::vector<BacklinkReference> backlinks;
    std::vector<std::string> references;
    std::vector<BacklinkReference> suggested_links;

    // JSON serialization
    std::string to_json() const;
    static Note from_json(const std::string& json_str);
    static std::string escape_json(const std::string& str);

private:
    static std::string vector_to_json(const std::vector<std::string>& vec);
    static std::string map_to_json(const std::map<std::string, std::string>& map);
    static std::string backlinks_to_json(const std::vector<BacklinkReference>& backlinks);
};
