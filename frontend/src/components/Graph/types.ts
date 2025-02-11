import { Note, NoteUpdate } from '../../types';

export type Section = 'backlinks' | 'current' | 'references' | 'tags';

export const nodeColors: Record<Section, string> = {
  backlinks: '#60a5fa', // blue-400
  current: '#34d399', // emerald-400
  references: '#f472b6', // pink-400
  tags: '#a78bfa', // violet-400
};

export interface NodeData {
  noteId: string;
  label: string;
  section: Section;
  tags: string[];
  created_at?: string;
  last_modified?: string;
  content?: string;
}

export interface GraphProps {
  currentNote: Note;
  allNotes: Note[];
  onNodeClick?: (noteId: string) => void;
  onUpdateNote?: (note: NoteUpdate) => Promise<void>;
}

export const SECTION_WIDTH = 300;
export const VERTICAL_SPACING = 100;
