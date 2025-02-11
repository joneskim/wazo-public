import { Note } from '../types';

interface NoteAssistantResponse {
  error?: string;
}

interface CreateNoteResponse extends NoteAssistantResponse {
  note?: Note;
}

interface ExpandSectionResponse extends NoteAssistantResponse {
  content?: string;
}

interface ConnectionSuggestion {
  noteId: string;
  reason: string;
}

interface ConnectionsResponse extends NoteAssistantResponse {
  connections?: ConnectionSuggestion[];
}

interface TocResponse extends NoteAssistantResponse {
  toc?: string;
}

interface ReorganizationResponse extends NoteAssistantResponse {
  suggestions?: string;
}

export class NoteAssistantService {
  // private static readonly API_URL = API_URL;

  static async createNoteFromTopic(topic: string): Promise<CreateNoteResponse> {
    try {
      const response = await fetch(`/api/note-assistant/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to create note' };
      }

      return { note: data.note };
    } catch (error) {
      console.error('Error creating note:', error);
      return { error: 'Failed to connect to note assistant service' };
    }
  }

  static async expandSection(noteId: string, sectionTitle: string): Promise<ExpandSectionResponse> {
    try {
      const response = await fetch(`/api/note-assistant/expand-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteId, sectionTitle }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to expand section' };
      }

      return { content: data.content };
    } catch (error) {
      console.error('Error expanding section:', error);
      return { error: 'Failed to connect to note assistant service' };
    }
  }

  static async suggestConnections(noteId: string): Promise<ConnectionsResponse> {
    try {
      const response = await fetch(`/api/note-assistant/suggest-connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to suggest connections' };
      }

      return { connections: data.connections };
    } catch (error) {
      console.error('Error suggesting connections:', error);
      return { error: 'Failed to connect to note assistant service' };
    }
  }

  static async generateTableOfContents(content: string): Promise<TocResponse> {
    try {
      const response = await fetch(`/api/note-assistant/generate-toc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to generate table of contents' };
      }

      return { toc: data.toc };
    } catch (error) {
      console.error('Error generating table of contents:', error);
      return { error: 'Failed to connect to note assistant service' };
    }
  }

  static async suggestReorganization(noteId: string): Promise<ReorganizationResponse> {
    try {
      const response = await fetch(`/apinote-assistant/suggest-reorganization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to suggest reorganization' };
      }

      return { suggestions: data.suggestions };
    } catch (error) {
      console.error('Error suggesting reorganization:', error);
      return { error: 'Failed to connect to note assistant service' };
    }
  }

  static async createLinkedNote(sourceNoteId: string, topic: string): Promise<CreateNoteResponse> {
    try {
      const response = await fetch(`/api/note-assistant/create-linked`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceNoteId, topic }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to create linked note' };
      }

      return { note: data.note };
    } catch (error) {
      console.error('Error creating linked note:', error);
      return { error: 'Failed to connect to note assistant service' };
    }
  }
}
