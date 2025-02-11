import express, { Request, Response } from 'express';
import { Note, ExecuteCodeRequest, ExecuteCodeResponse, CodeBlock, BacklinkManager } from '../models/Note';
import { Task, TaskStatus, TaskPriority, TaskCreateInput, TaskUpdateInput } from '../models/Task';
import { DatabaseService } from '../services/database';
import { AIClient } from '../services/aiClient';
import { ChildProcess, spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { SettingsService } from '../services/settings';
import { KnowledgeService } from '../services/knowledge';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Initialize settings
async function initializeServices() {
  await SettingsService.initialize();
}

// Initialize on module load
(async () => {
  await initializeServices();
})().catch((error: Error) => {
  console.error('Error initializing services:', error);
  process.exit(1);
});

// Get all notes with optional search and pagination
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { query, page = '1', pageSize = '20' } = req.query;
    const currentPage = parseInt(page as string);
    const limit = parseInt(pageSize as string);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let notes: Note[];
    if (query) {
      notes = await DatabaseService.searchNotes(query as string, userId);
    } else {
      notes = await DatabaseService.getAllNotes(userId);
    }

    const startIndex = (currentPage - 1) * limit;
    const endIndex = currentPage * limit;
    const paginatedNotes = notes.slice(startIndex, endIndex);

    res.json({
      notes: paginatedNotes,
      total: notes.length,
      currentPage,
      totalPages: Math.ceil(notes.length / limit)
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get a specific note by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const note = await DatabaseService.getNote(req.params.id, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create a new note
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const now = new Date().toISOString();
    const noteData: Omit<Note, 'id'> = {
      content: req.body.content || '',
      created_at: now,
      last_modified: now,
      tags: req.body.tags || [],
      code_outputs: {},
      backlinks: [],
      references: [],
      suggested_links: []
    };

    const note = await DatabaseService.createNote(noteData, userId);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update a note
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updatedNote = await DatabaseService.updateNote(req.params.id, req.body, userId);
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
router.delete('/:id', async (req: AuthRequest, res) => {
  console.log(`[NotesRouter] Received DELETE request for note id: ${req.params.id}`);
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const success = await DatabaseService.deleteNote(req.params.id, userId);
    if (!success) {
      console.log(`[NotesRouter] Note ${req.params.id} not found or could not be deleted`);
      return res.status(404).json({ error: 'Note not found' });
    }
    console.log(`[NotesRouter] Successfully deleted note ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error('[NotesRouter] Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Delete all notes (dangerous operation!)
router.delete('/all/confirm', async (req: AuthRequest, res) => {
  console.log('[NotesRouter] Received request to delete all notes');
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const success = await DatabaseService.deleteAllNotes(userId);
    if (!success) {
      console.log('[NotesRouter] Failed to delete all notes');
      return res.status(500).json({ error: 'Failed to delete all notes' });
    }
    console.log('[NotesRouter] Successfully deleted all notes');
    res.status(204).send();
  } catch (error) {
    console.error('[NotesRouter] Error deleting all notes:', error);
    res.status(500).json({ error: 'Failed to delete all notes' });
  }
});

// Get all tasks
router.get('/tasks', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tasks = await DatabaseService.getAllTasks(userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a specific task
router.get('/tasks/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const task = await DatabaseService.getTask(req.params.id, userId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task
router.post('/tasks', authMiddleware, async (req: AuthRequest<{}, {}, TaskCreateInput>, res) => {
  try {
    const { title, description, status, priority, due_date, tags } = req.body;
    const task = await DatabaseService.createTask({
      title,
      description,
      status,
      priority,
      due_date,
      tags,
      user_id: req.user!.id
    });
    res.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/tasks/:id', authMiddleware, async (req: AuthRequest<{ id: string }, {}, TaskUpdateInput>, res) => {
  try {
    const { title, description, status, priority, due_date, tags } = req.body;
    const task = await DatabaseService.updateTask(req.params.id, {
      title,
      description,
      status,
      priority,
      due_date,
      tags
    }, req.user!.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/tasks/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const success = await DatabaseService.deleteTask(req.params.id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Add task to note
router.post('/notes/:noteId/tasks/:taskId', authMiddleware, async (req: AuthRequest<{ noteId: string; taskId: string }>, res) => {
  try {
    await DatabaseService.addNoteToTask(req.params.noteId, req.params.taskId);
    const task = await DatabaseService.getTaskById(req.params.taskId, req.user!.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error adding task to note:', error);
    res.status(500).json({ error: 'Failed to add task to note' });
  }
});

// Remove task from note
router.delete('/notes/:noteId/tasks/:taskId', authMiddleware, async (req: AuthRequest<{ noteId: string; taskId: string }>, res) => {
  try {
    await DatabaseService.removeNoteFromTask(req.params.noteId, req.params.taskId);
    const task = await DatabaseService.getTaskById(req.params.taskId, req.user!.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error removing task from note:', error);
    res.status(500).json({ error: 'Failed to remove task from note' });
  }
});

// Get tasks by date range
router.get('/tasks/by-date', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const tasks = await DatabaseService.getTasksByDateRange(startDate as string, endDate as string, userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks by date range:', error);
    res.status(500).json({ error: 'Failed to get tasks by date range' });
  }
});

// Complete task
router.post('/tasks/:id/complete', authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const task = await DatabaseService.updateTaskStatus(req.params.id, req.user!.id, TaskStatus.DONE);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Get suggested links for a note
router.get('/:id/suggestions', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const note = await DatabaseService.getNote(id, userId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // If note already has suggestions, return them immediately
    if (note.suggested_links && note.suggested_links.length > 0) {
      return res.json(note.suggested_links);
    }

    // Otherwise, generate new suggestions
    await KnowledgeService.updateKnowledgeGraph(id, userId);
    const updatedNote = await DatabaseService.getNote(id, userId);
    res.json(updatedNote?.suggested_links || []);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Accept a suggested link
router.post('/:id/suggestions/:targetId/accept', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id, targetId } = req.params;
    await KnowledgeService.acceptSuggestion(id, targetId, userId);
    const updatedNote = await DatabaseService.getNote(id, userId);
    res.json(updatedNote);
  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({ error: 'Failed to accept suggestion' });
  }
});

// Reject a suggested link
router.post('/:id/suggestions/:targetId/reject', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id, targetId } = req.params;
    await KnowledgeService.rejectSuggestion(id, targetId, userId);
    const updatedNote = await DatabaseService.getNote(id, userId);
    res.json(updatedNote);
  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    res.status(500).json({ error: 'Failed to reject suggestion' });
  }
});

// Search notes
router.get('/search/:query', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const allNotes = await DatabaseService.getAllNotes(userId);
    const query = req.params.query.toLowerCase();
    const notes = allNotes.filter(note => 
      note.content.toLowerCase().includes(query) || 
      note.tags.some(tag => tag.toLowerCase().includes(query))
    );
    res.json(notes);
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ error: 'Failed to search notes' });
  }
});

// Execute code
router.post('/execute', async (req: AuthRequest<{}, {}, ExecuteCodeRequest>, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { code, language } = req.body;
    const timestamp = new Date().toISOString();

    // Execute code and get response
    const response: ExecuteCodeResponse = {
      output: 'Code execution not implemented yet',
      error: undefined,
      executionTime: 0,
      timestamp
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
