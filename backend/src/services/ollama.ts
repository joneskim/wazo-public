import axios from 'axios';
import { Note } from '../models/Note';
import { OllamaResponse, GenerateOptions } from '../types';

export interface EmbeddingResult {
  embedding: number[];
  similarity: number;
}

export class OllamaService {
  private static readonly OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api';
  private static isAvailable: boolean | null = null;
  private static readonly MODELS = ['mistral', 'llama2', 'codellama', 'mixtral'];
  private static readonly DEFAULT_MODEL = 'mistral';

  private static async getCurrentModel(): Promise<string> {
    const settings = await import('../services/settings').then(m => m.SettingsService.getSettings());
    return settings.ollamaModel || this.DEFAULT_MODEL;
  }

  private static async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }

    try {
      await axios.get(`${this.OLLAMA_URL}/version`);
      this.isAvailable = true;
      console.log('Ollama service is available');
      return true;
    } catch (error) {
      this.isAvailable = false;
      console.warn('Ollama service is not available. Some AI features will be limited.');
      return false;
    }
  }

  private static handleOllamaError(error: any): never {
    if (axios.isAxiosError(error)) {
      const response = error.response?.data;
      if (response?.error?.includes('rate limit exceeded')) {
        throw new Error('Rate limit exceeded. Please try again in a few minutes or switch to a different model.');
      } else if (response?.error) {
        throw new Error(`Ollama error: ${response.error}`);
      }
    }
    throw error;
  }

  private static extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex) || [];
    return matches
      .map(tag => tag.slice(1).toLowerCase()) // Remove # and convert to lowercase
      .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
  }

  static async generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
    if (!(await this.checkAvailability())) {
      throw new Error('Ollama service is not available');
    }

    try {
      const model = await this.getCurrentModel();
      const response = await axios.post(
        `${this.OLLAMA_URL}/generate`,
        {
          model,
          prompt,
          stream: false,
          ...options
        }
      );

      return response.data.response;
    } catch (error) {
      this.handleOllamaError(error);
    }
  }

  static async generateSuggestions(note: Note, allNotes: Note[]): Promise<string[]> {
    if (!(await this.checkAvailability())) {
      return [
        'Enable Ollama service for AI-powered suggestions',
        'Add more details to your note',
        'Consider adding relevant tags'
      ];
    }

    try {
      const prompt = `Based on this note content:
${note.content}

And considering these related notes:
${allNotes.map(n => n.content).join('\n\n')}

Generate 3 concise suggestions for additional content or improvements. Format as a list.`;

      const response = await this.generate(prompt);
      return response
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [
        'Add more details to your note',
        'Consider adding relevant tags',
        'Link to related notes'
      ];
    }
  }

  static async generateTags(content: string): Promise<string[]> {
    // First, extract any manual hashtags
    const manualTags = this.extractHashtags(content);
    
    // If Ollama is not available, just return manual tags
    if (!(await this.checkAvailability())) {
      return manualTags.length > 0 ? manualTags : ['note', 'untitled'];
    }

    try {
      // Generate AI tags
      const prompt = `Generate 3-5 relevant tags for this content. Return only the tags, separated by commas, no explanations:

${content}`;

      const response = await this.generate(prompt, { temperature: 0.7 });
      const aiTags = response
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag && !tag.includes(' ')); // Remove empty tags and tags with spaces

      // Combine manual and AI tags, remove duplicates
      const allTags = [...new Set([...manualTags, ...aiTags])];
      
      // Return at most 5 tags
      return allTags.slice(0, 5);
    } catch (error) {
      console.error('Error generating tags:', error);
      // Fallback to manual tags or default tags
      return manualTags.length > 0 ? manualTags : ['note', 'untitled'];
    }
  }

  static async generateEmbedding(text: string): Promise<number[]> {
    if (!(await this.checkAvailability())) {
      // Return a zero vector as fallback
      return new Array(1536).fill(0);
    }

    try {
      const model = await this.getCurrentModel();
      const response = await axios.post(`${this.OLLAMA_URL}/embeddings`, {
        model,
        prompt: text
      });

      return response.data.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return a zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  private static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static async findSimilarNotes(sourceNote: Note, allNotes: Note[]): Promise<Array<{ noteId: string; relevance: number; context: string }>> {
    if (!(await this.checkAvailability())) {
      return [];
    }

    try {
      // Get embedding for source note
      const sourceEmbedding = await this.generateEmbedding(sourceNote.content);
      if (!sourceEmbedding) return [];

      // Get embeddings for all notes and calculate similarity
      const similarities = await Promise.all(
        allNotes
          .filter(note => note.id !== sourceNote.id)
          .map(async note => {
            const embedding = await this.generateEmbedding(note.content);
            if (!embedding) return null;

            const similarity = this.cosineSimilarity(sourceEmbedding, embedding);
            return {
              noteId: note.id,
              relevance: similarity,
              context: note.content.substring(0, 200)
            };
          })
      );

      // Sort by similarity and take top results
      return similarities
        .filter((s): s is { noteId: string; relevance: number; context: string } => s !== null)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5);
    } catch (error) {
      console.error('Error suggesting links:', error);
      return [];
    }
  }

  static async suggestLinks(sourceNote: Note, allNotes: Note[]): Promise<Array<{ noteId: string; relevance: number; context: string }>> {
    if (!(await this.checkAvailability())) {
      return [];
    }

    try {
      // Get embedding for source note
      const sourceEmbedding = await this.generateEmbedding(sourceNote.content);

      // Compare with all other notes
      const suggestions = await Promise.all(
        allNotes
          .filter(note => note.id !== sourceNote.id)
          .map(async (note) => {
            try {
              const targetEmbedding = await this.generateEmbedding(note.content);
              const relevance = this.cosineSimilarity(sourceEmbedding, targetEmbedding);

              if (relevance > 0.7) {
                const context = await this.generate(
                  `Compare these two notes and explain their relationship in one sentence:\n\nNote 1: ${sourceNote.content.substring(0, 500)}...\n\nNote 2: ${note.content.substring(0, 500)}...`
                );
                const stringContext = context;

                return {
                  noteId: note.id,
                  relevance,
                  context: stringContext.trim()
                };
              }
              return null;
            } catch (error) {
              console.error(`Error processing note ${note.id}:`, error);
              return null;
            }
          })
      );

      return suggestions.filter((s): s is { noteId: string; relevance: number; context: string } => s !== null);
    } catch (error) {
      console.error('Error suggesting links:', error);
      return [];
    }
  }

  static async summarizeContent(content: string): Promise<string> {
    if (!(await this.checkAvailability())) {
      return content.substring(0, 200) + '...';
    }

    try {
      const prompt = `Summarize this content in 2-3 concise sentences:
${content}`;

      const response = await this.generate(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error summarizing content:', error);
      return content.substring(0, 200) + '...';
    }
  }
}
