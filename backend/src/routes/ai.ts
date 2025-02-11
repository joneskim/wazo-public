import express, { Request, Response } from 'express';
import { OllamaService } from '../services/ollama';
import { Note } from '../models/Note';
import { NoteContext } from '../types';

const router = express.Router();

// Generate content based on prompt
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await OllamaService.generate(prompt);
    res.json({ text: response });
  } catch (error) {
    console.error('Error in /generate:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Generate suggestions based on current note
router.post('/suggestions', async (req: Request<{}, {}, NoteContext>, res: Response) => {
  try {
    const { sourceNote, allNotes } = req.body;
    if (!sourceNote?.content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const suggestions = await OllamaService.generateSuggestions(sourceNote, allNotes || []);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error in /suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Generate tags for note content
router.post('/tags', async (req: Request<{}, {}, { content: string }>, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const tags = await OllamaService.generateTags(content);
    res.json({ tags });
  } catch (error) {
    console.error('Error in /tags:', error);
    res.status(500).json({ error: 'Failed to generate tags' });
  }
});

// Generate summary for content
router.post('/summarize', async (req: Request<{}, {}, { content: string }>, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const summary = await OllamaService.summarizeContent(content);
    res.json({ summary });
  } catch (error) {
    console.error('Error in /summarize:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;
