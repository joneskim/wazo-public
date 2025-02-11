export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  linkedNoteIds: string[];
  tags: string[];
  created_at: string;
  last_modified: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface TaskStore {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const taskPriorityColors = {
  [TaskPriority.LOW]: '#E3F2FD',  // Soft blue
  [TaskPriority.MEDIUM]: '#FFF3E0', // Mustard yellow
  [TaskPriority.HIGH]: '#FFEBEE',   // Rust red
};

export const taskPriorityTextColors = {
  [TaskPriority.LOW]: '#1E88E5',    // Darker blue for text
  [TaskPriority.MEDIUM]: '#F57C00', // Darker yellow for text
  [TaskPriority.HIGH]: '#E53935',   // Darker red for text
};

export const taskStatusColors = {
  [TaskStatus.TODO]: '#F5F5F5',       // Light gray
  [TaskStatus.IN_PROGRESS]: '#F3E5F5', // Light lavender
  [TaskStatus.COMPLETED]: '#E8F5E9',   // Light forest green
};

export const taskStatusTextColors = {
  [TaskStatus.TODO]: '#757575',        // Dark gray
  [TaskStatus.IN_PROGRESS]: '#7B1FA2',  // Dark purple
  [TaskStatus.COMPLETED]: '#2E7D32',    // Dark green
};
