import { Note } from '../types';
import axiosInstance from './axiosConfig';
import type { AxiosResponse } from 'axios';

interface AIResponse {
  content: string;
  error?: string;
}

export class AIService {
  static async generateSuggestions(currentNote: Note, allNotes: Note[]): Promise<string[]> {
    try {
      const response: AxiosResponse<{ suggestions: string[] }> = await axiosInstance.post(`/api/ai/suggestions`, {
        noteContent: currentNote.content,
        contextNotes: allNotes.map(note => ({
          id: note.id,
          title: note.title || 'Untitled Note',
          content: note.content,
          tags: note.tags,
        })),
      });

      return response.data.suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  static async generateTags(content: string): Promise<string[]> {
    try {
      const response: AxiosResponse<{ tags: string[] }> = await axiosInstance.post(`/api/ai/tags`, { content });
      return response.data.tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      return [];
    }
  }

  static async generateContent(prompt: string, onToken?: (token: string) => void): Promise<{ content?: string; error?: string }> {
    try {
      const response: AxiosResponse<ReadableStream> = await axiosInstance.post(`/api/ai/generate`, { prompt }, {
        responseType: 'stream',
      });

      if (response.status !== 200) {
        return { error: 'Failed to generate content' };
      }

      let content = '';
      const decoder = new TextDecoder();

      const stream = response.data as any;
      stream.on('data', (chunk: Buffer) => {
        const lines = decoder.decode(chunk).split('\n').filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5);

          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              content += parsed.token;
              onToken?.(parsed.token);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      });

      await new Promise((resolve) => {
        stream.on('end', resolve);
      });

      return { content };
    } catch (error) {
      return { error: 'Failed to generate content' };
    }
  }

  static async summarize(content: string): Promise<string> {
    try {
      const response: AxiosResponse<{ summary: string }> = await axiosInstance.post(`/api/ai/summarize`, { content });
      return response.data.summary;
    } catch (error) {
      console.error('Error summarizing content:', error);
      return '';
    }
  }

  static async findRelatedNotes(sourceNote: Note, allNotes: Note[]): Promise<Array<{ noteId: string; relevance: number; context: string }>> {
    try {
      const response: AxiosResponse<{ relatedNotes: Array<{ noteId: string; relevance: number; context: string }> }> = await axiosInstance.post(`/api/ai/related`, {
        sourceNote,
        allNotes
      });

      return response.data.relatedNotes;
    } catch (error) {
      console.error('Error finding related notes:', error);
      return [];
    }
  }
}
