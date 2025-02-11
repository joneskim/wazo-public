import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? path.resolve(process.cwd(), '.env.production')
  : path.resolve(process.cwd(), '.env.development.local');
dotenv.config({ path: envPath });

import { PrismaClient, Task as PrismaTask, Note as PrismaNote } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '../models/Note';
import { Task, TaskStatus, TaskPriority, TaskCreateInput, TaskUpdateInput } from '../models/Task';
import { User } from '../models/User';

// Initialize PrismaClient with connection retry logic
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['query', 'error', 'warn']
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export class DatabaseService {
  private static prisma = prisma;

  // User-related methods
  static async createUser(data: { email: string; passwordHash: string; name?: string }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name
      }
    });

    return this.convertToUser(user);
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    return user ? this.convertToUser(user) : null;
  }

  static async getUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    return user ? this.convertToUser(user) : null;
  }

  private static convertToUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name || undefined,
      passwordHash: data.passwordHash,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString()
    };
  }

  // Note-related methods
  static async getAllNotes(userId: string): Promise<Note[]> {
    console.log('[DatabaseService] Getting notes for user:', userId);
    const notes = await this.prisma.note.findMany({
      where: {
        user_id: userId
      }
    });
    console.log(`[DatabaseService] Found ${notes.length} notes for user ${userId}`);
    return notes.map(note => ({
      id: note.id,
      content: note.content,
      created_at: note.created_at,
      last_modified: note.last_modified,
      tags: JSON.parse(note.tags) as string[],
      code_outputs: JSON.parse(note.code_outputs) as Record<string, any>,
      backlinks: JSON.parse(note.backlinks) as any[],
      references: JSON.parse(note.references) as string[],
      suggested_links: JSON.parse(note.suggested_links) as any[]
    }));
  }

  static async getNote(id: string, userId: string): Promise<Note | null> {
    const note = await this.prisma.note.findFirst({
      where: { 
        id,
        user_id: userId
      }
    });

    if (!note) return null;

    return {
      id: note.id,
      content: note.content,
      created_at: note.created_at,
      last_modified: note.last_modified,
      tags: JSON.parse(note.tags) as string[],
      code_outputs: JSON.parse(note.code_outputs) as Record<string, any>,
      backlinks: JSON.parse(note.backlinks) as any[],
      references: JSON.parse(note.references) as string[],
      suggested_links: JSON.parse(note.suggested_links) as any[]
    };
  }

  static async createNote(note: Omit<Note, 'id'>, userId: string): Promise<Note> {
    console.log('[DatabaseService] Creating note for user:', userId);
    const result = await this.prisma.note.create({
      data: {
        id: uuidv4(),
        content: note.content,
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        tags: JSON.stringify(note.tags || []),
        code_outputs: JSON.stringify(note.code_outputs || {}),
        backlinks: JSON.stringify(note.backlinks || []),
        references: JSON.stringify(note.references || []),
        suggested_links: JSON.stringify(note.suggested_links || []),
        user_id: userId
      }
    });

    return this.convertToNote(result);
  }

  static async updateNote(id: string, updates: Partial<Note>, userId: string): Promise<Note | null> {
    try {
      // First verify the note exists and belongs to the user
      const existingNote = await prisma.note.findFirst({
        where: { 
          id,
          user_id: userId
        }
      });

      if (!existingNote) {
        return null;
      }

      // Prepare the update data carefully
      const updateData: any = {
        last_modified: new Date().toISOString()
      };

      // Only include fields that are actually being updated
      if (updates.content !== undefined) {
        updateData.content = updates.content;
      }
      if (updates.tags !== undefined) {
        updateData.tags = JSON.stringify(updates.tags);
      }
      if (updates.code_outputs !== undefined) {
        updateData.code_outputs = JSON.stringify(updates.code_outputs);
      }
      if (updates.backlinks !== undefined) {
        updateData.backlinks = JSON.stringify(updates.backlinks);
      }
      if (updates.references !== undefined) {
        updateData.references = JSON.stringify(updates.references);
      }
      if (updates.suggested_links !== undefined) {
        updateData.suggested_links = JSON.stringify(updates.suggested_links);
      }

      // Perform the update
      const updatedNote = await prisma.note.update({
        where: { id },
        data: updateData,
        include: { tasks: true }
      });

      return this.convertToNote(updatedNote);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  static async deleteNote(id: string, userId: string): Promise<boolean> {
    try {
      // First verify the note belongs to the user
      const note = await this.prisma.note.findFirst({
        where: {
          id,
          user_id: userId
        }
      });

      if (!note) {
        console.log(`[DatabaseService] Note ${id} not found for user ${userId}`);
        return false;
      }

      console.log(`[DatabaseService] Attempting to delete note ${id} for user ${userId}`);
      
      // First, disconnect all tasks from the note
      await this.prisma.note.update({
        where: { id },
        data: {
          tasks: {
            set: [] // Remove all task associations
          }
        }
      });

      // Then delete the note
      await this.prisma.note.delete({
        where: { id }
      });
      
      console.log(`[DatabaseService] Successfully deleted note ${id}`);
      return true;
    } catch (error) {
      console.error('[DatabaseService] Error deleting note:', error);
      return false;
    }
  }

  static async deleteAllNotes(userId: string): Promise<boolean> {
    try {
      console.log('[DatabaseService] Attempting to delete all notes for user:', userId);
      
      // First, remove all task associations
      await this.prisma.note.updateMany({
        where: {
          user_id: userId
        },
        data: {}
      });
      console.log('[DatabaseService] Removed all task associations');

      // Then delete all notes
      const result = await this.prisma.note.deleteMany({
        where: {
          user_id: userId
        }
      });
      console.log(`[DatabaseService] Successfully deleted ${result.count} notes`);
      return true;
    } catch (error) {
      console.error('[DatabaseService] Error deleting all notes:', error);
      return false;
    }
  }

  static async updateManyNotes(where: Prisma.NoteWhereInput, data: Omit<Prisma.NoteUpdateManyMutationInput, 'last_modified'>): Promise<Prisma.BatchPayload> {
    const now = new Date().toISOString();

    // Find all notes that match the where condition
    const notes = await prisma.note.findMany({ where });

    // Update each note individually
    const updates = await Promise.all(
      notes.map(note => 
        prisma.note.update({
          where: { id: note.id },
          data: {
            ...data,
            last_modified: now
          }
        })
      )
    );

    return { count: updates.length };
  }

  static async updateNoteTask(noteId: string, taskId: string | null): Promise<Note> {
    const now = new Date().toISOString();
    
    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        last_modified: now
      }
    });

    // Get current task relations
    const currentTasks = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        tasks: {
          select: {
            id: true
          }
        }
      }
    });

    // Update task relations
    if (taskId) {
      await prisma.note.update({
        where: { id: noteId },
        data: {
          tasks: {
            set: [{ id: taskId }]
          }
        }
      });
    } else {
      await prisma.note.update({
        where: { id: noteId },
        data: {
          tasks: {
            set: []
          }
        }
      });
    }

    // Return updated note with tasks
    const updatedNote = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        tasks: true
      }
    });

    return this.mapNoteFromPrisma(updatedNote!);
  }

  static async addNoteToTask(noteId: string, taskId: string): Promise<void> {
    const now = new Date().toISOString();
    
    await prisma.note.update({
      where: { id: noteId },
      data: {
        last_modified: now,
        tasks: {
          connect: {
            id: taskId
          }
        }
      }
    });
  }

  static async removeNoteFromTask(noteId: string, taskId: string): Promise<void> {
    const now = new Date().toISOString();
    
    await prisma.note.update({
      where: { id: noteId },
      data: {
        last_modified: now,
        tasks: {
          disconnect: {
            id: taskId
          }
        }
      }
    });
  }

  static async updateNoteRelations(noteId: string, taskIds: string[]): Promise<Note> {
    const now = new Date().toISOString();
    
    // Update note with new task relations
    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        last_modified: now,
        tasks: {
          set: taskIds.map(id => ({ id }))
        }
      },
      include: {
        tasks: true
      }
    });

    return this.mapNoteFromPrisma(note);
  }

  // Task-related methods
  static async getAllTasks(userId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        user_id: userId
      },
      include: {
        notes: true
      }
    });
    console.log(`[DatabaseService] Found ${tasks.length} tasks for user ${userId}`);
    if (!tasks) return [];
    
    return tasks.map(task => this.mapTaskFromPrisma(task));
  }

  private static mapTaskFromPrisma(task: any): Task {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      created_at: task.created_at,
      last_modified: task.last_modified,
      tags: task.tags,
      user_id: task.user_id,
      notes: task.notes?.map((note: any) => this.mapNoteFromPrisma(note)) || []
    };
  }

  static async getTask(id: string, userId: string): Promise<Task | null> {
    try {
      const task = await prisma.task.findFirst({
        where: { id, user_id: userId }
      });
      return task ? this.mapTaskFromPrisma(task) : null;
    } catch (error) {
      console.error('Error getting task:', error);
      return null;
    }
  }

  static async getTaskById(id: string, userId: string): Promise<Task | null> {
    const task = await this.prisma.task.findFirst({
      where: { 
        id,
        user_id: userId 
      },
      include: {
        notes: true
      }
    });

    if (!task) return null;

    return this.mapTaskFromPrisma(task);
  }

  static async createTask(taskData: TaskCreateInput): Promise<Task> {
    const task = await prisma.task.create({
      data: {
        id: uuidv4(),
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.due_date,
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        tags: JSON.stringify(taskData.tags ?? []),
        user_id: taskData.user_id
      },
      include: {
        notes: true
      }
    });

    return this.mapTaskFromPrisma(task);
  }

  static async updateTask(taskId: string, taskData: TaskUpdateInput, userId: string): Promise<Task | null> {
    const task = await prisma.task.update({
      where: {
        id: taskId,
        user_id: userId
      },
      data: {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.due_date,
        last_modified: new Date().toISOString(),
        tags: taskData.tags ? JSON.stringify(taskData.tags) : undefined
      },
      include: {
        notes: true
      }
    });

    return this.mapTaskFromPrisma(task);
  }

  static async updateTaskStatus(taskId: string, userId: string, status: TaskStatus): Promise<Task | null> {
    const task = await prisma.task.update({
      where: {
        id: taskId,
        user_id: userId
      },
      data: {
        status,
        last_modified: new Date().toISOString()
      },
      include: {
        notes: true
      }
    });

    return this.mapTaskFromPrisma(task);
  }

  static async deleteTask(id: string, userId: string): Promise<boolean> {
    try {
      const task = await prisma.task.findFirst({
        where: { id, user_id: userId }
      });

      if (!task) {
        return false;
      }

      await prisma.task.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  static async linkTaskToNote(taskId: string, noteId: string, userId: string): Promise<Task | null> {
    try {
      const task = await prisma.task.findFirst({
        where: { id: taskId, user_id: userId }
      });

      if (!task) {
        return null;
      }

      const note = await prisma.note.findFirst({
        where: { id: noteId, user_id: userId }
      });

      if (!note) {
        return null;
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          notes: {
            connect: [{ id: noteId }]
          }
        },
        include: {
          notes: true
        }
      });
      return this.mapTaskFromPrisma(updatedTask);
    } catch (error) {
      console.error('Error linking task to note:', error);
      throw error;
    }
  }

  static async unlinkTaskFromNote(taskId: string, noteId: string, userId: string): Promise<Task | null> {
    try {
      const task = await prisma.task.findFirst({
        where: { id: taskId, user_id: userId }
      });

      if (!task) {
        return null;
      }

      const note = await prisma.note.findFirst({
        where: { id: noteId, user_id: userId }
      });

      if (!note) {
        return null;
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          notes: {
            disconnect: [{ id: noteId }]
          }
        },
        include: {
          notes: true
        }
      });
      return this.mapTaskFromPrisma(updatedTask);
    } catch (error) {
      console.error('Error unlinking task from note:', error);
      throw error;
    }
  }

  static async getTasksByStatus(userId: string, status: TaskStatus): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        status
      },
      include: {
        notes: true
      }
    });

    return tasks.map(task => this.mapTaskFromPrisma(task));
  }

  static async getTasksByPriority(userId: string, priority: TaskPriority): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        priority
      },
      include: {
        notes: true
      }
    });

    return tasks.map(task => this.mapTaskFromPrisma(task));
  }

  static async getTasksByDateRange(userId: string, startDate: string, endDate: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        due_date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        notes: true
      }
    });

    return tasks.map(task => this.mapTaskFromPrisma(task));
  }

  static async searchTasks(query: string, userId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } }
        ]
      },
      include: {
        notes: true
      }
    });

    return tasks.map(task => this.mapTaskFromPrisma(task));
  }

  static async getTasksWithNotes(userId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        notes: {
          some: {}
        }
      },
      include: {
        notes: true
      }
    });

    return tasks.map(task => this.mapTaskFromPrisma(task));
  }

  static async getTasksWithoutNotes(userId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        notes: {
          none: {}
        }
      },
      include: {
        notes: true
      }
    });

    return tasks.map(task => this.mapTaskFromPrisma(task));
  }

  static async getTasks(params: {
    where: {
      user_id: string;
      status?: TaskStatus;
    };
  }): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: params.where,
      include: {
        notes: true
      }
    });

    return tasks.map(task => this.mapTaskFromPrisma(task));
  }

  static async searchNotes(query: string, userId: string): Promise<Note[]> {
    const notes = await this.prisma.note.findMany({
      where: {
        user_id: userId,
        content: {
          contains: query
        }
      }
    });

    return notes.map(note => ({
      id: note.id,
      content: note.content,
      created_at: note.created_at,
      last_modified: note.last_modified,
      tags: JSON.parse(note.tags) as string[],
      code_outputs: JSON.parse(note.code_outputs) as Record<string, any>,
      backlinks: JSON.parse(note.backlinks) as any[],
      references: JSON.parse(note.references) as string[],
      suggested_links: JSON.parse(note.suggested_links) as any[]
    }));
  }

  static async getNoteById(id: string, userId: string): Promise<Note | null> {
    const note = await this.prisma.note.findFirst({
      where: {
        id,
        user_id: userId
      }
    });

    if (!note) return null;

    return {
      id: note.id,
      content: note.content,
      created_at: note.created_at,
      last_modified: note.last_modified,
      tags: JSON.parse(note.tags) as string[],
      code_outputs: JSON.parse(note.code_outputs) as Record<string, any>,
      backlinks: JSON.parse(note.backlinks) as any[],
      references: JSON.parse(note.references) as string[],
      suggested_links: JSON.parse(note.suggested_links) as any[]
    };
  }

  static async createWelcomeNote(userId: string): Promise<Note> {
    const welcomeNote: Omit<Note, 'id'> = {
      content: '# Welcome to Wazo Notes!\n\nThis is your first note.',
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      tags: [],
      code_outputs: {},
      backlinks: [],
      references: [],
      suggested_links: []
    };

    return await this.createNote(welcomeNote, userId);
  }

  private static convertToNote(data: any): Note {
    return {
      id: data.id,
      content: data.content,
      created_at: data.created_at,
      last_modified: data.last_modified,
      tags: JSON.parse(data.tags),
      code_outputs: JSON.parse(data.code_outputs),
      backlinks: JSON.parse(data.backlinks),
      references: JSON.parse(data.references),
      suggested_links: JSON.parse(data.suggested_links)
    };
  }

  private static mapNoteFromPrisma(note: any): Note {
    return {
      id: note.id,
      content: note.content,
      created_at: note.created_at,
      last_modified: note.last_modified,
      tags: JSON.parse(note.tags),
      code_outputs: JSON.parse(note.code_outputs),
      backlinks: JSON.parse(note.backlinks),
      references: JSON.parse(note.references),
      suggested_links: JSON.parse(note.suggested_links)
    };
  }
}
