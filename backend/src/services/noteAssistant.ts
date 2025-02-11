import { Note, BacklinkReference } from '../models/Note';
import { NoteStore } from '../models/Note';
import { v4 as uuidv4 } from 'uuid';
import { AIClient } from './aiClient';
import { AIOptions, LinkSuggestion } from '../types/ai';
import { Request, Response } from 'express';

interface NoteLink {
  noteId: string;
  context: string;
  relevance: number;
  accepted: boolean;
  rejected: boolean;
  timestamp: string;
}

// Map to track ongoing operations
export class NoteAssistant {
  private static readonly DEFAULT_TIMEOUT = 60000; // 60 seconds
  private static readonly LONG_OPERATION_TIMEOUT = 120000; // 2 minutes
  private static activeOperations: Map<string, AbortController> = new Map();

  private static registerOperation(operationId: string): AbortController {
    const controller = new AbortController();
    this.activeOperations.set(operationId, controller);
    return controller;
  }

  static cancelOperation(operationId: string): boolean {
    const controller = this.activeOperations.get(operationId);
    if (controller) {
      controller.abort();
      this.activeOperations.delete(operationId);
      return true;
    }
    return false;
  }

  private static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = this.DEFAULT_TIMEOUT,
    operationId?: string
  ): Promise<T> {
    const controller = operationId ? this.registerOperation(operationId) : new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      if (operationId) {
        this.activeOperations.delete(operationId);
      }
    }, timeoutMs);

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
          });
        })
      ]);

      clearTimeout(timeoutId);
      if (operationId) {
        this.activeOperations.delete(operationId);
      }
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (operationId) {
        this.activeOperations.delete(operationId);
      }
      throw error;
    }
  }

  private static createEmptyNote(): Note {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      content: '',
      created_at: now,
      last_modified: now,
      tags: [],
      code_outputs: {},
      backlinks: [],
      references: [],
      suggested_links: [],
      tasks: []
    };
  }

  private static async generateSuggestions(note: Note): Promise<NoteLink[]> {
    const currentTime = new Date().toISOString();
    const suggestions = await AIClient.suggestLinks(
      note.content,
      NoteStore.getAllNotes().map(n => n.content),
      {
        signal: undefined
      }
    );

    return suggestions.map((suggestion: any) => ({
      noteId: NoteStore.getAllNotes()[suggestion.index].id,
      relevance: suggestion.relevance || 0,
      context: suggestion.context || '',
      accepted: false,
      rejected: false,
      timestamp: currentTime
    }));
  }

  private static async executeWithTimeout<T>(
    operation: () => Promise<T>,
    options: { timeout?: number, signal?: AbortSignal } = {},
    operationId?: string
  ): Promise<T> {
    const controller = new AbortController();

    if (operationId) {
      this.activeOperations.set(operationId, controller);
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<T>((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(new Error('Operation timed out'));
          }, options.timeout || this.DEFAULT_TIMEOUT);
        }),
        new Promise<T>((_, reject) => {
          if (options.signal) {
            options.signal.addEventListener('abort', () => {
              controller.abort();
              reject(new Error('Operation was cancelled'));
            });
          }
        })
      ]);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Operation was cancelled');
      }
      throw error;
    } finally {
      if (operationId) {
        this.activeOperations.delete(operationId);
      }
    }
  }

  private static async execute<T>(
    operation: () => Promise<T>,
    options: { signal?: AbortSignal } = {}
  ): Promise<T> {
    try {
      const result = await Promise.race([
        operation(),
        new Promise<T>((_, reject) => {
          if (options.signal) {
            options.signal.addEventListener('abort', () => {
              reject(new Error('Operation was cancelled'));
            });
          }
        })
      ]);

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Operation was cancelled');
      }
      throw error;
    }
  }

  static async createNoteFromTopic(topic: string, operationId: string): Promise<Note> {
    return this.executeWithTimeout(async () => {
      try {
        const prompt = `Create a detailed note about "${topic}". Include relevant sections and key points. Format in markdown.`;
        
        const content = await AIClient.generate(prompt, {
          signal: operationId ? this.activeOperations.get(operationId)?.signal : undefined
        });

        if (!content) {
          throw new Error('Failed to generate note content');
        }

        const newNote = this.createEmptyNote();
        newNote.content = content;

        await NoteStore.createNote(newNote);
        return newNote;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error creating note from topic:', errorMessage);
        
        // Create a basic note if AI generation fails
        const fallbackNote = this.createEmptyNote();
        fallbackNote.content = `# ${topic}\n\n_Note: This is a basic version. AI-enhanced content generation failed._`;
        await NoteStore.createNote(fallbackNote);
        return fallbackNote;
      }
    }, { timeout: this.LONG_OPERATION_TIMEOUT }, operationId);
  }

  static async generateTags(noteId: string, operationId: string, maxTags: number = 5): Promise<string[]> {
    return this.withTimeout(async () => {
      try {
        const note = NoteStore.getNoteById(noteId);
        if (!note) {
          throw new Error('Note not found');
        }

        const tags = await AIClient.generateTags(note.content, maxTags, {
          signal: operationId ? this.activeOperations.get(operationId)?.signal : undefined
        });

        if (tags && tags.length > 0) {
          note.tags = [...new Set([...note.tags, ...tags])];
          await NoteStore.updateNote(note);
        }

        return tags;
      } catch (error) {
        console.error('Error generating tags:', error);
        return [];
      }
    }, this.DEFAULT_TIMEOUT, operationId);
  }

  static async expandSection(noteId: string, sectionTitle: string, operationId: string): Promise<string> {
    return this.withTimeout(async () => {
      try {
        const note = NoteStore.getNoteById(noteId);
        if (!note) {
          throw new Error('Note not found');
        }

        const prompt = `Expand the following section "${sectionTitle}" based on this context:

${note.content}

Provide detailed, relevant content for this section. Format in markdown.`;

        const content = await AIClient.generate(prompt, {
          signal: operationId ? this.activeOperations.get(operationId)?.signal : undefined
        });

        if (!content) {
          throw new Error('Failed to expand section');
        }

        return content;
      } catch (error) {
        console.error('Error expanding section:', error);
        return `_Failed to expand section. Please try again later._`;
      }
    }, this.DEFAULT_TIMEOUT, operationId);
  }

  static async suggestLinks(noteId: string, operationId: string): Promise<NoteLink[]> {
    return this.withTimeout(async () => {
      try {
        const sourceNote = NoteStore.getNoteById(noteId);
        if (!sourceNote) {
          throw new Error('Source note not found');
        }

        const suggestions = await this.generateSuggestions(sourceNote);

        // Update the note with new suggestions
        sourceNote.suggested_links = suggestions;
        await NoteStore.updateNote(sourceNote);

        return suggestions;
      } catch (error) {
        console.error('Error suggesting links:', error);
        return [];
      }
    }, this.LONG_OPERATION_TIMEOUT, operationId);
  }

  static async suggestReorganization(noteId: string, operationId: string): Promise<string> {
    return this.withTimeout(async () => {
      try {
        const note = NoteStore.getNoteById(noteId);
        if (!note) {
          throw new Error('Note not found');
        }

        const prompt = `Analyze this note and suggest how to reorganize it for better clarity and structure. Consider:
- Logical flow of ideas
- Heading hierarchy
- Related concepts grouping
- Key points emphasis

Note content:
${note.content}

Provide specific suggestions for reorganization in markdown format.`;

        const content = await AIClient.generate(prompt, {
          signal: operationId ? this.activeOperations.get(operationId)?.signal : undefined
        });

        if (!content) {
          throw new Error('Failed to suggest reorganization');
        }

        return content;
      } catch (error) {
        console.error('Error suggesting reorganization:', error);
        return `_Failed to suggest reorganization. Please try again later._`;
      }
    }, this.DEFAULT_TIMEOUT, operationId);
  }

  static async createLinkedNote(sourceNoteId: string, topic: string, operationId: string): Promise<Note> {
    return this.executeWithTimeout(async () => {
      try {
        const sourceNote = NoteStore.getNoteById(sourceNoteId);
        if (!sourceNote) {
          throw new Error('Source note not found');
        }

        const prompt = `Create a new note about "${topic}" that relates to this context:

${sourceNote.content}

Include relevant connections and references to the source material. Format in markdown.`;

        const content = await AIClient.generate(prompt, {
          signal: operationId ? this.activeOperations.get(operationId)?.signal : undefined
        });

        if (!content) {
          throw new Error('Failed to create linked note');
        }

        const tags = await this.generateTags(sourceNoteId, operationId);

        const newNote = this.createEmptyNote();
        newNote.content = content;
        newNote.tags = tags;
        newNote.backlinks = [{
          noteId: sourceNoteId,
          context: `Created as a linked note from source discussing ${topic}`,
          timestamp: new Date().toISOString()
        }];
        newNote.references = [sourceNoteId];

        await NoteStore.createNote(newNote);
        return newNote;
      } catch (error) {
        console.error('Error creating linked note:', error);
        // Create a basic note as fallback
        const fallbackNote = this.createEmptyNote();
        fallbackNote.content = `# ${topic}\n\n_Note: This is a basic version. AI-enhanced content generation failed._\n\nRelated to: [[${sourceNoteId}]]`;
        fallbackNote.backlinks = [{
          noteId: sourceNoteId,
          context: `Created as a linked note (basic version)`,
          timestamp: new Date().toISOString()
        }];
        fallbackNote.references = [sourceNoteId];
        await NoteStore.createNote(fallbackNote);
        return fallbackNote;
      }
    }, { timeout: this.LONG_OPERATION_TIMEOUT }, operationId);
  }

  static async generateTableOfContents(content: string, operationId: string): Promise<string> {
    return this.withTimeout(async () => {
      try {
        const prompt = `Create a table of contents for the following note. Format in markdown with proper heading levels:

${content}`;

        const tableOfContents = await AIClient.generate(prompt, {
          signal: operationId ? this.activeOperations.get(operationId)?.signal : undefined
        });

        if (!tableOfContents) {
          throw new Error('Failed to generate table of contents');
        }

        return tableOfContents;
      } catch (error) {
        console.error('Error generating table of contents:', error);
        return `_Failed to generate table of contents. Please try again later._`;
      }
    }, this.DEFAULT_TIMEOUT, operationId);
  }

  static async suggestConnections(noteId: string, operationId: string): Promise<Array<{ noteId: string; reason: string }>> {
    return this.withTimeout(async () => {
      try {
        const sourceNote = NoteStore.getNoteById(noteId);
        if (!sourceNote) {
          throw new Error('Note not found');
        }

        const allNotes = NoteStore.getAllNotes();
        const suggestions: LinkSuggestion[] = await AIClient.suggestLinks(
          sourceNote.content,
          allNotes.map(note => note.content),
          {
            signal: operationId ? this.activeOperations.get(operationId)?.signal : undefined
          }
        );

        return suggestions.map((suggestion: LinkSuggestion) => ({
          noteId: allNotes[suggestion.index].id,
          reason: suggestion.context
        }));
      } catch (error) {
        console.error('Error suggesting connections:', error);
        return [];
      }
    }, this.DEFAULT_TIMEOUT, operationId);
  }
}
