import { Note, BacklinkReference } from '../models/Note';
import { DatabaseService } from './database';
import { OllamaService } from './ollama';
import { SettingsService } from './settings';
import { createHash } from 'crypto';

export interface LinkSuggestion {
  sourceId: string;
  targetId: string;
  relevance: number;
  context: string;
  accepted: boolean;
  rejected?: boolean;
}

export class KnowledgeService {
  private static suggestions: Map<string, LinkSuggestion[]> = new Map();
  private static isProcessing = false;
  private static processingQueue: string[] = [];
  private static lastProcessedTime: Map<string, number> = new Map();
  private static readonly SIMILARITY_THRESHOLD = 0.7;
  private static contentHashes = new Map<string, string>();

  static async initialize(): Promise<void> {
    await SettingsService.initialize();
  }

  static async updateKnowledgeGraph(noteId: string, userId: string): Promise<void> {
    const allNotes = await DatabaseService.getAllNotes(userId);
    const sourceNote = allNotes.find((note: Note) => note.id === noteId);
    if (!sourceNote) return;

    // Sync backlinks before updating suggestions
    await this.syncBacklinks(sourceNote, userId);

    // Check if we already have suggestions and content hasn't changed
    const existingSuggestions = this.suggestions.get(noteId);
    const currentHash = this.hashContent(sourceNote.content);
    const lastHash = this.contentHashes.get(noteId);
    
    if (existingSuggestions && lastHash === currentHash) {
      // Content hasn't changed, use existing suggestions but filter out accepted/rejected ones
      const currentTime = new Date().toISOString();
      sourceNote.suggested_links = existingSuggestions
        .filter(s => !s.accepted && !s.rejected && !sourceNote.references?.includes(s.targetId))
        .map(suggestion => ({
          noteId: suggestion.targetId,
          relevance: suggestion.relevance,
          context: suggestion.context,
          accepted: suggestion.accepted,
          rejected: suggestion.rejected,
          timestamp: currentTime
        }));
      return;
    }

    // Get or generate embedding for source note
    const sourceEmbedding = await this.getOrGenerateEmbedding(sourceNote);
    if (!sourceEmbedding) return;

    // Find similar notes
    const suggestions: LinkSuggestion[] = [];
    for (const targetNote of allNotes) {
      if (targetNote.id === noteId) continue;

      const targetEmbedding = await this.getOrGenerateEmbedding(targetNote);
      if (!targetEmbedding) continue;

      const similarity = await this.calculateSimilarity(sourceEmbedding, targetEmbedding);
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        const context = await this.generateLinkContext(sourceNote, targetNote);
        suggestions.push({
          sourceId: noteId,
          targetId: targetNote.id,
          relevance: similarity,
          context,
          accepted: false
        });
      }
    }

    // Update suggestions
    this.suggestions.set(noteId, suggestions);
    await this.processNote(sourceNote, userId);

    // Save updated note
    await DatabaseService.updateNote(noteId, sourceNote, userId);
  }

  static async acceptSuggestion(sourceId: string, targetId: string, userId: string): Promise<void> {
    const allNotes = await DatabaseService.getAllNotes(userId);
    const sourceNote = allNotes.find((note: Note) => note.id === sourceId);
    const targetNote = allNotes.find((note: Note) => note.id === targetId);

    if (!sourceNote || !targetNote) return;

    // Update source note
    if (!sourceNote.references) sourceNote.references = [];
    if (!sourceNote.references.includes(targetId)) {
      sourceNote.references.push(targetId);
    }

    // Update target note backlinks
    if (!targetNote.backlinks) targetNote.backlinks = [];
    const existingBacklink = targetNote.backlinks.find(bl => bl.noteId === sourceId);
    if (!existingBacklink) {
      targetNote.backlinks.push({
        noteId: sourceId,
        context: this.suggestions.get(sourceId)?.find(s => s.targetId === targetId)?.context || '',
        timestamp: new Date().toISOString()
      });
    }

    // Mark suggestion as accepted
    const suggestions = this.suggestions.get(sourceId);
    if (suggestions) {
      const suggestion = suggestions.find(s => s.targetId === targetId);
      if (suggestion) {
        suggestion.accepted = true;
      }
    }

    // Save both notes
    await Promise.all([
      DatabaseService.updateNote(sourceId, sourceNote, userId),
      DatabaseService.updateNote(targetId, targetNote, userId)
    ]);
  }

  static async rejectSuggestion(sourceId: string, targetId: string, userId: string): Promise<void> {
    const allNotes = await DatabaseService.getAllNotes(userId);
    const sourceNote = allNotes.find((note: Note) => note.id === sourceId);
    if (!sourceNote) return;

    // Mark suggestion as rejected
    const suggestions = this.suggestions.get(sourceId);
    if (suggestions) {
      const suggestion = suggestions.find(s => s.targetId === targetId);
      if (suggestion) {
        suggestion.rejected = true;
      }
    }

    // Update note's suggested links
    sourceNote.suggested_links = sourceNote.suggested_links?.filter(link => link.noteId !== targetId) || [];

    // Save note
    await DatabaseService.updateNote(sourceId, sourceNote, userId);
  }

  static async processAllNotesImmediately(userId: string): Promise<void> {
    const allNotes = await DatabaseService.getAllNotes(userId);
    console.log(`Processing ${allNotes.length} notes...`);
    
    for (const note of allNotes) {
      try {
        await this.updateKnowledgeGraph(note.id, userId);
      } catch (error) {
        console.error(`Error processing note ${note.id}:`, error);
      }
    }
  }

  static startBackgroundProcessing(intervalMinutes: number = 15, userId: string): void {
    // Convert minutes to milliseconds
    const interval = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
      if (this.isProcessing) {
        return;
      }

      try {
        this.isProcessing = true;
        const allNotes = await DatabaseService.getAllNotes(userId);
        const now = Date.now();

        for (const note of allNotes) {
          const lastProcessed = this.lastProcessedTime.get(note.id) || 0;
          if (now - lastProcessed >= interval) {
            try {
              await this.updateKnowledgeGraph(note.id, userId);
              this.lastProcessedTime.set(note.id, now);
            } catch (error) {
              console.error(`Error processing note ${note.id} in background:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error in background processing:', error);
      } finally {
        this.isProcessing = false;
      }
    }, interval);

    console.log(`Background processing started with ${intervalMinutes} minute interval`);
  }

  static async processNote(sourceNote: Note, userId: string): Promise<void> {
    const currentTime = new Date().toISOString();
    const currentNoteHash = this.hashContent(sourceNote.content);
    const lastUpdateHash = this.contentHashes.get(sourceNote.id);

    // Only update if content has changed
    if (lastUpdateHash === currentNoteHash) {
      return;
    }

    const suggestions = await this.generateSuggestedLinks(sourceNote, userId);
    sourceNote.suggested_links = suggestions.map(suggestion => ({
      ...suggestion,
      timestamp: currentTime
    }));

    this.contentHashes.set(sourceNote.id, currentNoteHash);
    await DatabaseService.updateNote(sourceNote.id, sourceNote, userId);
  }

  private static hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private static async generateSuggestedLinks(sourceNote: Note, userId: string): Promise<BacklinkReference[]> {
    const currentTime = new Date().toISOString();
    const allNotes = await DatabaseService.getAllNotes(userId);
    
    return allNotes
      .filter(note => note.id !== sourceNote.id)
      .map(note => ({
        noteId: note.id,
        relevance: this.calculateRelevance(sourceNote.content, note.content),
        context: this.generateContext(sourceNote.content, note.content),
        accepted: false,
        rejected: false,
        timestamp: currentTime
      }))
      .filter(suggestion => suggestion.relevance > 0.5);
  }

  private static calculateRelevance(sourceContent: string, targetContent: string): number {
    const words1 = new Set(sourceContent.toLowerCase().split(/\s+/));
    const words2 = new Set(targetContent.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private static generateContext(sourceContent: string, targetContent: string): string {
    const relevance = this.calculateRelevance(sourceContent, targetContent);
    return `Relevance score: ${(relevance * 100).toFixed(2)}%`;
  }

  private static async syncBacklinks(note: Note, userId: string): Promise<void> {
    const allNotes = await DatabaseService.getAllNotes(userId);
    const currentTime = new Date().toISOString();
    const existingSuggestions = note.suggested_links;

    if (existingSuggestions && existingSuggestions.length > 0) {
      note.suggested_links = existingSuggestions.map(s => ({
        ...s,
        timestamp: currentTime
      }));
    }

    await DatabaseService.updateNote(note.id, note, userId);
  }

  private static async getOrGenerateEmbedding(note: Note): Promise<number[]> {
    // Implementation for getting or generating embeddings
    // This would typically use an AI service
    return [];  // Placeholder
  }

  private static async calculateSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    // Implementation for calculating cosine similarity between embeddings
    return 0;  // Placeholder
  }

  private static async generateLinkContext(sourceNote: Note, targetNote: Note): Promise<string> {
    // Implementation for generating context description for the link
    return '';  // Placeholder
  }
}
