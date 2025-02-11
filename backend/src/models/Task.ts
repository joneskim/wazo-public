import { Note } from './Note';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
  last_modified: string;
  tags: string[];
  notes: Note[];
  user_id: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  user_id: string;
  tags?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
}

export interface TaskStore {
  tasks: Task[];
  selectedTask: Task | null;
}
