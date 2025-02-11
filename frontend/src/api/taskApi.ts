import axiosInstance from '../services/axiosConfig';
import { AxiosError, isAxiosError } from 'axios';
import { Task } from '../types/task';
import { config } from '../config';

const API_BASE_URL = config.apiBaseUrl;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    if (axiosError.response?.data?.error) {
      throw new Error(axiosError.response.data.error);
    }
    if (axiosError.response?.status === 404) {
      throw new Error('Resource not found');
    }
    if (axiosError.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
  }
  throw new Error(defaultMessage);
};

const retry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      return retry(fn, retries - 1);
    }
    throw error;
  }
};


export const taskApi = {
  getAllTasks: async (): Promise<Task[]> => {
    const response = await retry(() => axiosInstance.get<any>(`/api/tasks`));
    console.log('Raw Response:', response.data);
    
    // Ensure we have an array
    const tasks = Array.isArray(response.data?.tasks) ? response.data.tasks :
                  Array.isArray(response.data?.data) ? response.data.data :
                  Array.isArray(response.data) ? response.data : [];

    return tasks; // Return the tasks array directly
},


  getTasksForCalendar: async (startDate: string, endDate: string): Promise<Task[]> => {
      const response = await retry(() => axiosInstance.get<Task[]>(`/api/tasks/calendar/${startDate}/${endDate}`));

      return response.data;
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    const response = await retry(() => axiosInstance.post<Task>(`/api/tasks`, task));
    console.log('Create Task Response:', response);
    
    // The task is directly in response.data since we got a 201 status
    return response.data;
},


  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
      const response = await retry(() => axiosInstance.put<ApiResponse<Task>>(`/api/tasks/${taskId}`, updates));

      return response.data.data;

  },

  deleteTask: async (taskId: string): Promise<void> => {

      const response = await retry(() => axiosInstance.delete<ApiResponse<void>>(`/api/tasks/${taskId}`));
      if (!response.data.success && response.status !== 204) {
        throw new Error(response.data.error || 'Failed to delete task');
      }

  }
};
