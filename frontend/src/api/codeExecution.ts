import axiosInstance from '../services/axiosConfig';
import type { CodeOutput } from '../types/Note';
import { AxiosError } from 'axios';

interface ExecuteCodeResponse {
  output: string | null;
  error: string | null;
  blockId: string;
}

export const executeCode = async (
  code: string, 
  language: string, 
  noteId: string, 
  blockId: string
): Promise<CodeOutput> => {
  try {
    console.log('Sending request to execute code:', { code, language, noteId, blockId }); // Debug log

    const response = await axiosInstance.post(`/api/execute`, {
      code,
      language: language.toLowerCase(), // Make sure language is lowercase
    });

    console.log('Received response:', response.data); // Debug log

    return {
      output: response.data.output,
      stderr: response.data.error,
      timestamp: new Date().toISOString(),
      codeBlock: {
        content: code,
        language,
        lineNumber: -1
      }
    };
  } catch (error) {
    console.error('Code execution error:', error);
    if (error instanceof AxiosError && error.response) {
      console.error('Error response:', error.response.data); // Log error response
    }
    return {
      output: '',
      stderr: error instanceof Error ? error.message : 'An error occurred',
      timestamp: new Date().toISOString(),
      codeBlock: {
        content: code,
        language,
        lineNumber: -1
      }
    };
  }
};
