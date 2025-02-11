import { Note } from '../models/Note';

export interface AIResponse {
  content?: string;
  error?: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AIServiceConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface NoteContext {
  sourceNote: Note;
  allNotes: Note[];
}

export interface NoteLink {
  noteId: string;
  relevance: number;
  context: string;
  accepted: boolean;
  rejected?: boolean;
}
