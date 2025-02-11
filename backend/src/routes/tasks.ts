import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { TaskService } from '../services/taskService';
import { TaskCreateInput, TaskUpdateInput } from '../models/Task';

const router = express.Router();
const taskService = TaskService.getInstance();

// Get all tasks
// Get all tasks
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
      const userId = req.user!.id;
      console.log(`Fetching tasks for userId: ${userId}`);
      
      const tasks = await taskService.getAllTasks(userId);
      console.log(`[DatabaseService] Found ${tasks.length} tasks for user ${userId}`);
      
      res.set('Cache-Control', 'no-store'); // Prevent caching
      
      // If no tasks are found, respond with a message or just an empty array
      if (tasks.length === 0) {
          return res.status(204).send(); // No Content
      }
      
      res.json({ tasks }); // Return tasks in a structured format
  } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Get task by ID
router.get('/:id', authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user!.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Create task
router.post('/', authMiddleware, async (req: AuthRequest<{}, {}, TaskCreateInput>, res) => {
  try {
    const taskData: TaskCreateInput = {
      ...req.body,
      user_id: req.user!.id
    };
    const task = await taskService.createTask(taskData);
    console.log('Created task:', task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req: AuthRequest<{ id: string }, {}, TaskUpdateInput>, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user!.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get completed tasks
router.get('/completed', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const tasks = await taskService.getCompletedTasks(req.user!.id);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting completed tasks:', error);
    res.status(500).json({ error: 'Failed to get completed tasks' });
  }
});

export default router;
