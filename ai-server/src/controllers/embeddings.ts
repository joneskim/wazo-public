import { Request, Response } from 'express';
import { OllamaClient } from '../lib/ollama';

const ollama = new OllamaClient();

export const generateEmbedding = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embedding = await ollama.generateEmbedding(text);
    return res.json({ embedding });
  } catch (error) {
    console.error('Error generating embedding:', error);
    return res.status(500).json({ error: 'Failed to generate embedding' });
  }
};
