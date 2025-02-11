import { CustomText, CustomElement } from './types/slate';

export interface Backlink {
  noteId: string;
  context: string;
}

export interface CodeOutput {
  output?: string;
  stderr?: string;
  timestamp: string;
  codeBlock?: {
    content: string;
    language: string;
    lineNumber: number;
  };
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
  last_modified: string;
  title?: string;
  tags: string; // JSON string array from Prisma
  code_outputs: string; // JSON object from Prisma
  backlinks: string; // JSON string array from Prisma
  references: string; // JSON string array from Prisma
  suggested_links: string; // JSON string array from Prisma
  // Frontend-only properties
  position?: {
    x: number;
    y: number;
  };
}

export type NoteUpdate = Partial<Note> & { id: string };

export interface NoteGraph {
  nodes: Note[];
  edges: {
    source: string;
    target: string;
    context: string;
  }[];
}

export interface CodeBlockProps {
  code: string;
  language: string;
  blockId: string;
  output?: string;
  error?: string;
  isExecuting: boolean;
  onExecute: (blockId: string, code: string, language: string) => Promise<void>;
}
