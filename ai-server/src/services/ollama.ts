import axios from 'axios';
import { GenerateRequest, GenerateResponse, TagGenerationRequest, SuggestLinksRequest, LinkSuggestion } from '../types';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'mistral';

export class OllamaService {
  private static readonly MAX_CHUNK_SIZE = 4000; // characters
  private static readonly MAX_CONTEXT_SIZE = 8000; // characters

  private static chunkText(text: string): string[] {
    if (text.length <= this.MAX_CHUNK_SIZE) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.MAX_CHUNK_SIZE) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        // If a single sentence is too long, split it by words
        if (sentence.length > this.MAX_CHUNK_SIZE) {
          const words = sentence.split(/\s+/);
          let tempChunk = '';
          for (const word of words) {
            if ((tempChunk + ' ' + word).length > this.MAX_CHUNK_SIZE) {
              chunks.push(tempChunk.trim());
              tempChunk = word;
            } else {
              tempChunk += (tempChunk ? ' ' : '') + word;
            }
          }
          if (tempChunk) {
            currentChunk = tempChunk;
          }
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private static async generateWithRetry(prompt: string, options: { model?: string; temperature?: number; max_tokens?: number } = {}, retries = 3): Promise<string> {
    try {
      const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
        model: options.model || DEFAULT_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 2048,
          num_ctx: 8192 // Explicitly set context window
        }
      }, {
        timeout: 60000 // 60 second timeout
      });

      if (!response.data?.response) {
        throw new Error('Invalid response format from Ollama');
      }

      return response.data.response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error || error.message;
        
        // Check for specific Ollama errors
        if (errorMessage.includes('unexpected EOF') || 
            errorMessage.includes('context length exceeded') ||
            status === 500) {
          if (retries > 0) {
            console.log(`Retrying with ${retries - 1} attempts remaining. Error: ${errorMessage}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.generateWithRetry(prompt, {
              ...options,
              temperature: (options.temperature || 0.7) + 0.1, // Slightly increase temperature
              max_tokens: Math.floor((options.max_tokens || 2048) * 0.8) // Reduce token limit
            }, retries - 1);
          }
        }
        
        throw new Error(`Ollama API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  static async generate(prompt: string, options: { model?: string; temperature?: number; max_tokens?: number } = {}): Promise<string> {
    if (prompt.length <= this.MAX_CONTEXT_SIZE) {
      return this.generateWithRetry(prompt, options);
    }

    // For long prompts, split into chunks and process separately
    console.log(`Splitting long prompt (${prompt.length} chars) into chunks...`);
    const chunks = this.chunkText(prompt);
    const results: string[] = [];

    for (const chunk of chunks) {
      try {
        const result = await this.generateWithRetry(chunk, {
          ...options,
          max_tokens: Math.min(options.max_tokens || 2048, Math.floor(chunk.length * 1.5))
        });
        results.push(result);
      } catch (error) {
        console.error('Error processing chunk:', error);
        // Continue with other chunks even if one fails
      }
    }

    return results.join('\n\n');
  }

  static async generateTags(content: string, maxTags: number = 5): Promise<string[]> {
    try {
      console.log('Generating tags for content:', {
        contentLength: content.length,
        maxTags
      });

      const prompt = `Generate ${maxTags} relevant tags for this content. Return only the tags, separated by commas, no explanations:

${content}`;

      const response = await this.generate(prompt, {
        temperature: 0.3, 
        max_tokens: 100 
      });
      
      if (!response) {
        console.error('No response from tag generation');
        return [];
      }

      const tags = response
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag && !tag.includes(' '))
        .slice(0, maxTags);

      console.log('Generated tags:', {
        rawResponse: response,
        processedTags: tags
      });

      return tags.length > 0 ? tags : [];
    } catch (error) {
      console.error('Error generating tags:', error);
      return [];
    }
  }

  static async suggestLinks(sourceContent: string, targetContents: string[]): Promise<LinkSuggestion[]> {
    try {
      // Limit the content size for each note
      const truncatedSource = sourceContent.slice(0, this.MAX_CHUNK_SIZE);
      const truncatedTargets = targetContents.map(content => 
        content.slice(0, this.MAX_CHUNK_SIZE)
      );

      const prompt = `Analyze the following note content and suggest relevant links to other notes.
Source note content:
${truncatedSource}

Target notes to analyze for links:
${truncatedTargets.map((content, index) => `Note ${index + 1}:\n${content}\n---`).join('\n')}

Provide link suggestions in this JSON format:
[{
  "index": 0,
  "relevance": 0.8,
  "context": "Brief explanation of the connection"
}]

Remember: Respond ONLY with the JSON array, no other text.`;

      const response = await this.generateWithRetry(prompt, {
        temperature: 0.3,
        max_tokens: Math.min(2048, prompt.length)
      });

      try {
        const jsonRegex = /\[\s*\{[^]*\}\s*\]/;
        const jsonMatch = response.match(jsonRegex);
        
        if (!jsonMatch) {
          console.error('No JSON array found in response:', response);
          try {
            const cleanedResponse = response
              .replace(/^[^[]*\[/, '[')
              .replace(/\][^]*$/, ']')
              .replace(/\n/g, ' ')
              .replace(/,\s*]/, ']');
            
            const suggestions = JSON.parse(cleanedResponse);
            if (Array.isArray(suggestions)) {
              return suggestions.map(s => ({
                index: s.index || 0,
                relevance: s.relevance || 0.5,
                context: s.context || 'Related content'
              }));
            }
          } catch (parseError) {
            console.error('Failed to parse cleaned response:', parseError);
          }
          return [];
        }

        const suggestions = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(suggestions)) {
          return [];
        }

        return suggestions.map(s => ({
          index: s.index || 0,
          relevance: s.relevance || 0.5,
          context: s.context || 'Related content'
        }));
      } catch (error) {
        console.error('Error parsing suggestions:', error);
        return [];
      }
    } catch (error) {
      console.error('Error suggesting links:', error);
      return [];
    }
  }

  private static validateAndSanitizeSuggestions(suggestions: any[], targetContents: string[]): Array<{ index: number; relevance: number; context: string }> {
    return suggestions
      .filter(s => 
        typeof s === 'object' &&
        typeof s.index === 'number' &&
        typeof s.relevance === 'number' &&
        typeof s.context === 'string' &&
        s.index >= 0 &&
        s.index < targetContents.length &&
        s.relevance >= 0 &&
        s.relevance <= 1
      )
      .map(s => ({
        index: Math.floor(s.index),
        relevance: Math.max(0, Math.min(1, s.relevance)),
        context: s.context.trim()
      }));
  }
}
