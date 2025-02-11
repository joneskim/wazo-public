import type { Cell } from './Note';

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  last_modified: string;
  tags: string;
  code_outputs: string;
  backlinks: string;
  references: string;
  suggested_links: string;
}

export interface CodeOutput {
  stdout: string;
  stderr: string;
  error?: {
    message: string;
    stack?: string;
  };
}

export type { Cell };
