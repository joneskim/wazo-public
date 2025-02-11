import React, { useState } from 'react';
import { Note } from '../types';
import { SearchModal } from '../components/Search/SearchModal';
import { NoteGraph } from '../components/Graph';

interface GraphViewProps {
  notes: Note[];
  selectedNote: Note | null;
  onNoteSelect: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ notes, selectedNote, onNoteSelect, onDeleteNote }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleNoteSelect = (noteId: string) => {
    onNoteSelect(noteId);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 relative">
        {selectedNote && (
          <NoteGraph
            currentNote={selectedNote}
            notes={notes}
            onNodeClick={handleNoteSelect}
          />
        )}
        
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Search Notes
          </button>
        </div>

        <SearchModal
          show={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          notes={notes.map(note => ({
            ...note,
            created_at: note.created_at || new Date().toISOString(),
            last_modified: note.last_modified || new Date().toISOString()
          }))}
          onNoteSelect={handleNoteSelect}
          onDeleteNote={onDeleteNote}
        />
      </div>
    </div>
  );
};
