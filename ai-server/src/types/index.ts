export interface GenerateRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResponse {
  content: string;
  error?: string;
}

export interface TagGenerationRequest {
  content: string;
  maxTags?: number;
}

export interface SuggestLinksRequest {
  sourceContent: string;
  targetContents: string[];
}

export interface LinkSuggestion {
  index: number;
  relevance: number;
  context: string;
}
