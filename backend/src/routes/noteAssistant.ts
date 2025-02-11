import express from 'express';
import { NoteAssistant } from '../services/noteAssistant';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create a new note from a topic (without tags or suggestions)
router.post('/create', async (req, res) => {
  const operationId = uuidv4();
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log('Creating note from topic:', topic);
    const note = await NoteAssistant.createNoteFromTopic(topic, operationId);
    res.json({ note, operationId });
  } catch (error) {
    console.error('Error in /note-assistant/create:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
    res.status(500).json({ error: errorMessage, operationId });
  }
});

// Cancel an ongoing operation
router.post('/cancel', (req, res) => {
  const { operationId } = req.body;
  if (!operationId) {
    return res.status(400).json({ error: 'Operation ID is required' });
  }

  try {
    NoteAssistant.cancelOperation(operationId);
    res.json({ message: 'Operation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling operation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel operation';
    res.status(500).json({ error: errorMessage });
  }
});

// Generate tags for a note
router.post('/generate-tags', async (req, res) => {
  const operationId = uuidv4();
  try {
    const { noteId, maxTags } = req.body;
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }

    console.log('Generating tags for note:', noteId);
    const tags = await NoteAssistant.generateTags(noteId, operationId, maxTags);
    res.json({ tags, operationId });
  } catch (error) {
    console.error('Error in /note-assistant/generate-tags:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate tags';
    res.status(500).json({ error: errorMessage, operationId });
  }
});

// Expand a section in a note
router.post('/expand-section', async (req, res) => {
  const operationId = uuidv4();
  try {
    const { noteId, sectionTitle } = req.body;
    if (!noteId || !sectionTitle) {
      return res.status(400).json({ error: 'Note ID and section title are required' });
    }

    console.log('Expanding section:', { noteId, sectionTitle });
    const content = await NoteAssistant.expandSection(noteId, sectionTitle, operationId);
    res.json({ content, operationId });
  } catch (error) {
    console.error('Error in /note-assistant/expand-section:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to expand section';
    res.status(500).json({ error: errorMessage, operationId });
  }
});

// Suggest connections between notes
router.post('/suggest-links', async (req, res) => {
  const operationId = uuidv4();
  try {
    const { noteId } = req.body;
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }

    console.log('Finding connections for note:', noteId);
    const suggestions = await NoteAssistant.suggestLinks(noteId, operationId);
    res.json({ suggestions, operationId });
  } catch (error) {
    console.error('Error in /note-assistant/suggest-links:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to suggest links';
    res.status(500).json({ error: errorMessage, operationId });
  }
});

export default router;
