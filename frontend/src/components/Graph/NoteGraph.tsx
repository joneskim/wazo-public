import React, { useMemo } from 'react';
import { Note } from '../../types';
import { parseJsonArray } from '../../utils/jsonUtils';
import D3Graph from './D3Graph';

interface NoteGraphProps {
  notes: Note[];
  currentNote: Note;
  onNodeClick?: (nodeId: string) => void;
  onUpdateNote?: (update: Partial<Note>) => Promise<void>;
}

export const NoteGraph: React.FC<NoteGraphProps> = ({
  notes,
  currentNote,
  onNodeClick,
  onUpdateNote,
}) => {
  // Get related notes
  const { backlinks, references, tagRelatedNotes } = useMemo(() => {
    const currentTags = parseJsonArray(currentNote.tags);
    const currentRefs = parseJsonArray(currentNote.references);

    // Get backlinks
    const backlinks = notes.filter(note =>
      parseJsonArray(note.references).includes(currentNote.id)
    );

    // Get references
    const references = notes.filter(note =>
      currentRefs.includes(note.id)
    );

    // Get tag-related notes
    const tagRelatedNotes = notes.filter(
      note =>
        note.id !== currentNote.id &&
        parseJsonArray(note.tags).some(tag => currentTags.includes(tag))
    );

    return { backlinks, references, tagRelatedNotes };
  }, [notes, currentNote]);

  return (
    <div className="w-full h-full relative">
      <D3Graph
        currentNote={currentNote}
        references={references}
        backlinks={backlinks}
        tagRelatedNotes={tagRelatedNotes}
        notes={notes}
        onNodeClick={nodeId => onNodeClick?.(nodeId)}
        onUpdateNote={onUpdateNote}
      />
    </div>
  );
};
