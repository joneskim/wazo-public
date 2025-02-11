import { Note } from '../types/Note';

export function generateNoteAlias(note: Note): string {
  // Generate a short alias from the title or first heading
  const titleMatch = note.content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : '';
  
  // Convert title to kebab case and take first 3-4 words
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-');
}

export function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1] : 'Untitled Note';
}

export function parseNoteLink(content: string): { id: string; title: string }[] {
  const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const links: { id: string; title: string }[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const [, id, title] = match;
    links.push({
      id,
      title: title || id
    });
  }

  return links;
}

export function createNoteLink(noteId: string, title?: string): string {
  return title ? `[[${noteId}|${title}]]` : `[[${noteId}]]`;
}

// Cache for note aliases
const noteAliasCache = new Map<string, string>();

export function getNoteAlias(noteId: string, notes: Map<string, Note>): string {
  if (noteAliasCache.has(noteId)) {
    return noteAliasCache.get(noteId)!;
  }

  const note = notes.get(noteId);
  if (!note) return noteId;

  const alias = generateNoteAlias(note);
  noteAliasCache.set(noteId, alias);
  return alias;
}

export function findNoteByAlias(alias: string, notes: Map<string, Note>): string | null {
  const entries = Array.from(notes);
  for (const [noteId, note] of entries) {
    if (generateNoteAlias(note) === alias) {
      return noteId;
    }
  }
  return null;
}

export function extractTags(content: string): string[] {
  // Match hashtags that:
  // 1. Start with # and are followed by a word character
  // 2. Are preceded by a space, newline, or start of string
  // 3. Are not inside code blocks (between ```)
  const tags = new Set<string>();
  
  // Split content by code blocks
  const parts = content.split('```');
  
  // Only process non-code parts (even indices)
  parts.forEach((part, index) => {
    if (index % 2 === 0) { // Not inside a code block
      // Find tags using regex
      const matches = part.match(/(?:^|\s)#(\w[\w-]*)/g) || [];
      matches.forEach(match => {
        // Clean up the tag (remove leading space if any and keep the #)
        const tag = match.trim();
        tags.add(tag);
      });
    }
  });
  
  return Array.from(tags);
}

export function formatParagraphs(content: string): string {
  if (!content) return '';

  // Step 1: Normalize line endings
  let formatted = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Step 2: Split content by code blocks
  const parts = formatted.split(/(```[^`]*```)/);

  // Step 3: Process each part
  formatted = parts
    .map((part, index) => {
      // Don't modify code blocks
      if (index % 2 === 1) return part;

      // For text content:
      return part
        // Add newline before headers
        .replace(/(^|\n)#{1,6}\s/g, '$1\n$&')
        // Add newline after headers
        .replace(/^(#{1,6}\s+[^\n]+)$/gm, '$1\n')
        // Normalize multiple newlines
        .replace(/\n{3,}/g, '\n\n');
    })
    .join('\n');

  // Step 4: Final cleanup
  return formatted
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface SlateText {
  text: string;
}

interface SlateNode {
  type?: string;
  children: (SlateNode | SlateText)[];
  text?: string;
}

export const getNoteTitle = (content: string): string => {
  try {
    const parsed = JSON.parse(content) as SlateNode[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      const firstBlock = parsed[0];
      if (firstBlock?.children?.[0] && 'text' in firstBlock.children[0]) {
        return firstBlock.children[0].text || 'Untitled';
      }
    }
  } catch (e) {}
  return content.split('\n')[0] || 'Untitled';
};

export const getNotePreview = (content: string): string => {
  try {
    const parsed = JSON.parse(content) as SlateNode[];
    if (Array.isArray(parsed)) {
      return parsed
        .slice(0, 3)
        .map(block => 
          block?.children
            ?.map(child => ('text' in child ? child.text : ''))
            .join('') || ''
        )
        .join('\n')
        .slice(0, 200);
    }
  } catch (e) {}
  return content.slice(0, 200);
};
