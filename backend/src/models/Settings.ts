import path from 'path';

export interface Settings {
  notesDirectory: string;
  ollamaModel: string;
  ollamaEndpoint: string;
  theme: 'light' | 'dark';
}

export type SettingsUpdate = Partial<Settings>;

export const AVAILABLE_MODELS = ['mistral', 'llama2', 'codellama', 'mixtral'] as const;
export type OllamaModel = typeof AVAILABLE_MODELS[number];

// Get the default notes directory relative to the backend root
const getDefaultNotesDirectory = () => {
  const backendRoot = path.resolve(__dirname, '../../');
  return path.join(backendRoot, 'data', 'notes');
};

export const DEFAULT_SETTINGS: Settings = {
  notesDirectory: getDefaultNotesDirectory(),
  ollamaModel: 'mistral',
  ollamaEndpoint: 'http://localhost:11434/api',
  theme: 'light'
};

export const validateSettings = (settings: Partial<Settings>): Partial<Settings> => {
  const validated: Partial<Settings> = {};

  if (settings.notesDirectory !== undefined) {
    validated.notesDirectory = settings.notesDirectory;
  }

  if (settings.ollamaModel !== undefined) {
    validated.ollamaModel = settings.ollamaModel;
  }

  if (settings.ollamaEndpoint !== undefined) {
    validated.ollamaEndpoint = settings.ollamaEndpoint;
  }

  if (settings.theme !== undefined) {
    validated.theme = settings.theme === 'dark' ? 'dark' : 'light';
  }

  return validated;
};
