import express from 'express';
import { OllamaService } from '../services/ollama';
import { GenerateRequest, TagGenerationRequest, SuggestLinksRequest } from '../types';

const router = express.Router();

// Generate content
router.post('/generate', async (req, res) => {
  try {
    const request: GenerateRequest = req.body;
    const content = await OllamaService.generate(request.prompt, {
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.maxTokens
    });
    res.json({ content });
  } catch (error) {
    console.error('Error in generate endpoint:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Generate tags
router.post('/tags', async (req, res) => {
  try {
    const request: TagGenerationRequest = req.body;
    if (!request.content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const tags = await OllamaService.generateTags(request.content, request.maxTags);
    res.json({ tags });
  } catch (error) {
    console.error('Error in tags endpoint:', error);
    res.status(500).json({ error: 'Failed to generate tags' });
  }
});

// Suggest links
router.post('/suggest-links', async (req, res) => {
  try {
    const request: SuggestLinksRequest = req.body;
    if (!request.sourceContent || !request.targetContents) {
      return res.status(400).json({ error: 'Source content and target contents are required' });
    }
    const suggestions = await OllamaService.suggestLinks(request.sourceContent, request.targetContents);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error in suggest-links endpoint:', error);
    res.status(500).json({ error: 'Failed to suggest links' });
  }
});

export default router;
