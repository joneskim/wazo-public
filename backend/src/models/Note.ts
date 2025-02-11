import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface Cell {
  id: string;
  type: 'markdown' | 'code';
  content: string;
  language?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  content?: string;
}

export interface ExecuteCodeResponse {
  output?: string;
  error?: string;
  executionTime?: number;
  timestamp?: string;
}

export interface BacklinkReference {
  noteId: string;  // ID of the note that links to this note
  context: string; // Context of the backlink
  timestamp: string;
  relevance?: number;
  accepted?: boolean;
  rejected?: boolean;
}

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  created_at: string;
  completed_at?: string;
  notes: string[]; // Array of note IDs
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
  last_modified: string;
  tags: string[];
  code_outputs: Record<string, any>;
  backlinks: BacklinkReference[];
  references: string[];
  suggested_links: BacklinkReference[];
  tasks?: string[]; // Array of task IDs
}

export interface ExecuteCodeRequest {
  code: string;
  language: string;
}

export interface NoteStore {
  [key: string]: Note;
}

export interface BacklinkManager {
  addBacklink(sourceId: string, targetId: string, context: string): Promise<void>;
  removeBacklink(sourceId: string, targetId: string): Promise<void>;
  getBacklinks(noteId: string): Promise<string[]>;
}

// In-memory storage for development
export class NoteStore {
  private static notes: Map<string, Note> = new Map();
  private static isProcessing: boolean = false;

  static async initialize(options: any = {}): Promise<void> {
    // No-op initialization since we're using Prisma now
  }

  static async createNote(note: Note, skipAI: boolean = false): Promise<Note> {
    this.notes.set(note.id, note);
    if (!skipAI) {
      await this.enrichNoteAsync(note.id);
    }
    return note;
  }

  static async loadExistingNote(note: Note): Promise<Note> {
    this.notes.set(note.id, note);
    return note;
  }

  static async enrichNoteAsync(noteId: string) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const note = this.notes.get(noteId);
      if (!note) return;

      // Generate tags
      const tags = await this.generateTags(note.content);
      note.tags = Array.from(new Set([...note.tags, ...tags]));

      // Generate suggestions
      const suggestions = await this.generateSuggestions(note);
      note.suggested_links = suggestions.map(suggestion => ({
        noteId: suggestion.noteId,
        context: suggestion.context,
        timestamp: new Date().toISOString()
      }));

      this.notes.set(noteId, note);
    } finally {
      this.isProcessing = false;
    }
  }

  static async generateTags(content: string): Promise<string[]> {
    const tags = new Set<string>();
    const tagRegex = /#[\w-]+/g;
    const matches = content.match(tagRegex);
    
    if (matches) {
      matches.forEach(tag => tags.add(tag.slice(1)));
    }
    
    return Array.from(tags);
  }

  static async generateSuggestions(note: Note): Promise<Array<{ noteId: string; context: string }>> {
    const suggestions: Array<{ noteId: string; context: string }> = [];
    const allNotes = Array.from(this.notes.values());
    
    // Simple content-based suggestion
    for (const otherNote of allNotes) {
      if (otherNote.id === note.id) continue;
      
      // Check for shared tags
      const sharedTags = note.tags.filter(tag => otherNote.tags.includes(tag));
      if (sharedTags.length > 0) {
        suggestions.push({
          noteId: otherNote.id,
          context: `Shares tags: ${sharedTags.join(', ')}`
        });
      }
    }
    
    return suggestions;
  }

  static updateNote(note: Note): Promise<Note> {
    this.notes.set(note.id, note);
    return Promise.resolve(note);
  }

  static getNoteById(id: string): Note | undefined {
    return this.notes.get(id);
  }

  static getAllNotes(): Note[] {
    return Array.from(this.notes.values());
  }

  static deleteNote(id: string): void {
    this.notes.delete(id);
  }
}

// Utility functions for backlink management
export class BacklinkManager {
  // Regular expression to match [[note-id]] or [[title]] or [[id|title]] patterns
  private static readonly LINK_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  static extractReferences(content: string): string[] {
    const references = new Set<string>();
    let match;

    while ((match = this.LINK_PATTERN.exec(content)) !== null) {
      const [_, idOrTitle, title] = match;
      const trimmedIdOrTitle = idOrTitle.trim();
      
      // If it's a direct ID reference or ID|title format
      if (trimmedIdOrTitle.match(/^[0-9a-f-]+$/i)) {
        references.add(trimmedIdOrTitle);
      } else {
        // It's a title reference, try to find the corresponding note
        const allNotes = NoteStore.getAllNotes();
        
        // First try exact match
        let noteByTitle = allNotes.find(note => {
          const firstLine = note.content.split('\n')[0] || '';
          const noteTitle = firstLine.replace(/^#\s*/, '').trim();
          return noteTitle.toLowerCase() === trimmedIdOrTitle.toLowerCase();
        });
        
        // If no exact match, try partial match
        if (!noteByTitle) {
          noteByTitle = allNotes.find(note => {
            const firstLine = note.content.split('\n')[0] || '';
            const noteTitle = firstLine.replace(/^#\s*/, '').trim();
            return noteTitle.toLowerCase().includes(trimmedIdOrTitle.toLowerCase());
          });
        }
        
        // If still no match, try matching any line in the content
        if (!noteByTitle) {
          noteByTitle = allNotes.find(note => {
            return note.content.toLowerCase().includes(trimmedIdOrTitle.toLowerCase());
          });
        }
        
        if (noteByTitle) {
          references.add(noteByTitle.id);
        }
      }
    }

    return Array.from(references);
  }

  static createBacklinkReference(sourceNoteId: string, context: string): BacklinkReference {
    return {
      noteId: sourceNoteId,
      context,
      timestamp: new Date().toISOString()
    };
  }

  static getBacklinkContext(content: string, referenceId: string): string {
    // Look for both [[id]] and [[id|title]] formats
    const escapedId = referenceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`[^.!?]*\\[\\[${escapedId}(?:\\|[^\\]]*)?\\]\\][^.!?]*[.!?]`);
    const match = content.match(pattern);
    return match ? match[0].trim() : '';
  }

  static updateBacklinks(sourceNote: Note, allNotes: Note[]): void {
    // Ensure all notes have initialized arrays
    if (!sourceNote.backlinks) sourceNote.backlinks = [];
    if (!sourceNote.references) sourceNote.references = [];
    
    allNotes.forEach(note => {
      if (!note.backlinks) note.backlinks = [];
      if (!note.references) note.references = [];
    });

    // Remove all old backlinks to this note
    allNotes.forEach(note => {
      note.backlinks = note.backlinks.filter(bl => bl && bl.noteId !== sourceNote.id);
    });

    // Extract references from the source note
    const references = this.extractReferences(sourceNote.content);
    
    // Validate references exist before setting them
    sourceNote.references = references.filter(refId => 
      refId && allNotes.some(note => note.id === refId)
    );

    // Add new backlinks to referenced notes
    sourceNote.references.forEach(refId => {
      if (!refId) return;
      const referencedNote = allNotes.find(note => note.id === refId);
      if (referencedNote) {
        const context = this.getBacklinkContext(sourceNote.content, refId);
        const backlink = this.createBacklinkReference(sourceNote.id, context);
        referencedNote.backlinks.push(backlink);
      }
    });
  }
}
