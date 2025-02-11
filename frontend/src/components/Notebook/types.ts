import { Note } from '../../types/Note';

export interface NotebookProps {
  note: Note;
  onUpdate: (note: Partial<Note>) => void;
  onDelete?: () => void;
  onCreate?: (note: Note) => void;
}
