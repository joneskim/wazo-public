import type { Note, CodeOutput } from '../types';

export type { Note, CodeOutput };

export interface Cell {
  id: string;
  type: 'markdown' | 'code';
  content: string;
  language?: string;
  lastExecuted?: string;
}
