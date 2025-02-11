import axios, { AxiosError } from 'axios';
import { AIResponse, TagResponse, LinkResponse, LinkSuggestion } from '../types/ai';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:3002';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export class AIClient {
  private static async retryWithDelay<T>(
    operation: () => Promise<T>,
    retries: number = MAX_RETRIES,
    delay: number = RETRY_DELAY
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries === 0 || axios.isCancel(error)) {
        throw error;
      }

      if (error instanceof Error) {
        const isConnectionError = 
          (error as AxiosError).code === 'ECONNREFUSED' ||
          (error as AxiosError).code === 'ECONNRESET' ||
          (error as AxiosError).code === 'ETIMEDOUT';

        if (!isConnectionError) {
          throw error;
        }

        console.log(`Retrying operation after error: ${error.message}. Retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithDelay(operation, retries - 1, delay * 1.5);
      }
      
      throw error;
    }
  }

  static async generate(prompt: string, options: AIOptions = {}): Promise<string> {
    return this.retryWithDelay(async () => {
      try {
        const { signal, ...aiOptions } = options;
        const response = await axios.post<AIResponse>(
          `${AI_SERVER_URL}/api/ai/generate`,
          {
            prompt,
            ...aiOptions
          },
          { 
            signal,
            timeout: 30000 // 30 second timeout
          }
        );

        if (!response.data || !response.data.content) {
          throw new Error('Invalid response format from AI server');
        }

        return response.data.content;
      } catch (error) {
        if (axios.isCancel(error)) {
          throw new Error('Operation cancelled by user');
        }
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNREFUSED') {
            throw new Error('Unable to connect to AI server. Please ensure the server is running.');
          }
          if (error.code === 'ECONNRESET') {
            throw new Error('Connection to AI server was reset. Please try again.');
          }
          if (error.code === 'ETIMEDOUT') {
            throw new Error('Connection to AI server timed out. Please try again.');
          }
          throw new Error(`AI server error: ${error.message}`);
        }
        throw error;
      }
    });
  }

  static async generateTags(content: string, maxTags: number = 5, options: AIOptions = {}): Promise<string[]> {
    return this.retryWithDelay(async () => {
      try {
        const { signal } = options;
        const response = await axios.post<TagResponse>(
          `${AI_SERVER_URL}/api/ai/tags`,
          {
            content,
            maxTags
          },
          { 
            signal,
            timeout: 15000 // 15 second timeout for tag generation
          }
        );

        if (!response.data || !response.data.tags) {
          console.error('Invalid tag response format:', response.data);
          return [];
        }

        return response.data.tags;
      } catch (error) {
        if (axios.isCancel(error)) {
          throw new Error('Operation cancelled by user');
        }
        console.error('Error generating tags:', error);
        return [];
      }
    });
  }

  static async suggestLinks(sourceContent: string, targetContents: string[], options: AIOptions = {}): Promise<LinkSuggestion[]> {
    return this.retryWithDelay(async () => {
      try {
        const { signal } = options;
        const response = await axios.post<LinkResponse>(
          `${AI_SERVER_URL}/api/ai/suggest-links`,
          {
            sourceContent,
            targetContents
          },
          { 
            signal,
            timeout: 45000 // 45 second timeout for link suggestions
          }
        );

        if (!response.data || !response.data.suggestions) {
          console.error('Invalid suggestions response format:', response.data);
          return [];
        }

        return response.data.suggestions;
      } catch (error) {
        if (axios.isCancel(error)) {
          throw new Error('Operation cancelled by user');
        }
        console.error('Error suggesting links:', error);
        return [];
      }
    });
  }
}
