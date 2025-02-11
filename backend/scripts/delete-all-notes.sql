-- First delete all associations in the _NoteToTask table
DELETE FROM "_NoteToTask";

-- Then delete all notes
DELETE FROM "Note";

-- Reset the SQLite sequence if it exists
DELETE FROM "sqlite_sequence" WHERE name = 'Note';
