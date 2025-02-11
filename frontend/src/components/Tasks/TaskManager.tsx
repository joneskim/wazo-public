import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/task';
import { taskApi } from '../../api/taskApi';
import TaskList from './TaskList';
import { TaskCalendar } from './TaskCalendar';
import { List, Calendar } from 'react-feather';
import { Button } from '../Notebook/EditorComponents';

type ViewType = 'list' | 'calendar';

interface TaskManagerProps {
  onTaskSelect?: (task: Task) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ onTaskSelect }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<ViewType>('list');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskApi.getAllTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (taskData: Task) => {
    try {
      setLoading(true);
      await taskApi.createTask(taskData);
      await fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskApi.updateTask(taskId, updates);
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -mb-px ml-[-1px]">
      <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setView('list')}
            active={view === 'list'}
            title="List View"
          >
            <List size={16} />
          </Button>
          <Button
            onClick={() => setView('calendar')}
            active={view === 'calendar'}
            title="Calendar View"
          >
            <Calendar size={16} />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 dark:border-gray-700">
        {view === 'list' ? (
          <TaskList
            tasks={tasks}
            onEditTask={(task) => handleUpdateTask(task.id, task)}
            onDeleteTask={handleDeleteTask}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            filter={filter}
            onFilterChange={setFilter}
          />
        ) : (
          <TaskCalendar
            tasks={tasks}
            onTaskDelete={handleDeleteTask}
            onTaskSelect={onTaskSelect}
          />
        )}
      </div>
    </div>
  );
};
