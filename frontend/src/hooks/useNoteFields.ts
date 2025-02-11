import { Note } from '../types';
import { parseJsonArray, stringifyArray, parseJsonObject } from '../utils/jsonUtils';

export interface ParsedNote extends Omit<Note, 'tags' | 'references' | 'backlinks' | 'suggested_links' | 'code_outputs'> {
  tags: string[];
  references: string[];
  backlinks: string[];
  suggested_links: string[];
  code_outputs: Record<string, any>;
}

export function getParsedNote(note: Note): ParsedNote {
  return {
    ...note,
    tags: parseJsonArray(note.tags),
    references: parseJsonArray(note.references),
    backlinks: parseJsonArray(note.backlinks),
    suggested_links: parseJsonArray(note.suggested_links),
    code_outputs: parseJsonObject(note.code_outputs, {}),
  };
}

export function prepareNoteUpdate(update: Partial<Note>): Partial<Note> {
  const prepared: Partial<Note> = { ...update };
  
  if (update.tags !== undefined) {
    prepared.tags = Array.isArray(update.tags) ? stringifyArray(update.tags) : update.tags;
  }

  if (update.references !== undefined) {
    prepared.references = Array.isArray(update.references) ? stringifyArray(update.references) : update.references;
  }

  if (update.backlinks !== undefined) {
    prepared.backlinks = Array.isArray(update.backlinks) ? stringifyArray(update.backlinks) : update.backlinks;
  }

  if (update.suggested_links !== undefined) {
    prepared.suggested_links = Array.isArray(update.suggested_links) ? stringifyArray(update.suggested_links) : update.suggested_links;
  }

  return prepared;
}
