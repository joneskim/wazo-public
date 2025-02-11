import { DatabaseService } from './database';
import { Task, TaskStatus, TaskPriority, TaskCreateInput, TaskUpdateInput } from '../models/Task';

export class TaskService {
  private static instance: TaskService;
  private constructor() {}

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  async createTask(taskData: TaskCreateInput): Promise<Task> {
    this.validateTaskData(taskData);
    return DatabaseService.createTask(taskData);
  }

  async updateTask(taskId: string, taskData: TaskUpdateInput, userId: string): Promise<Task | null> {
    this.validateTaskData(taskData);
    return DatabaseService.updateTask(taskId, taskData, userId);
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    await DatabaseService.deleteTask(taskId, userId);
  }

  async getTaskById(taskId: string, userId: string): Promise<Task | null> {
    return DatabaseService.getTaskById(taskId, userId);
  }

  async getAllTasks(userId: string): Promise<Task[]> {
    // this.validateTaskData({});
    console.log('getAllTasks');
    return DatabaseService.getAllTasks(userId);
  }

  async getCompletedTasks(userId: string): Promise<Task[]> {
    return DatabaseService.getTasks({
      where: {
        user_id: userId,
        status: TaskStatus.DONE
      }
    });
  }

  private validateTaskData(taskData: Partial<TaskCreateInput | TaskUpdateInput>): void {
    if (taskData.status && !Object.values(TaskStatus).includes(taskData.status)) {
      throw new Error('Invalid task status');
    }

    if (taskData.priority && !Object.values(TaskPriority).includes(taskData.priority)) {
      throw new Error('Invalid task priority');
    }

    if (taskData.due_date && !this.isValidDate(taskData.due_date)) {
      throw new Error('Invalid due date format');
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
