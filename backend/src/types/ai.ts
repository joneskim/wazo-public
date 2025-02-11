export interface LinkSuggestion {
  index: number;
  relevance: number;
  context: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

export interface TagResponse {
  tags: string[];
  error?: string;
}

export interface LinkResponse {
  suggestions: LinkSuggestion[];
  error?: string;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}
