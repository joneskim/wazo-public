import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/task';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TaskEditModalProps {
  task: Task;
  onSave: (task: Task) => void;
  onClose: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onSave, onClose }) => {
  const [editedTask, setEditedTask] = useState<Task>({
    ...task,
    tags: Array.isArray(task.tags) ? task.tags : []
  });
  const [tagInput, setTagInput] = useState<string>(
    Array.isArray(task.tags) ? task.tags.join(', ') : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...editedTask,
      last_modified: new Date().toISOString()
    });
  };

  const handleTagChange = (value: string) => {
    setTagInput(value);
    const newTags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    setEditedTask(prev => ({ ...prev, tags: newTags }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {task.id ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) =>
                setEditedTask({ ...editedTask, title: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                       placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="Task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={editedTask.description}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                       placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={editedTask.status}
              onChange={(e) =>
                setEditedTask({
                  ...editedTask,
                  status: e.target.value as TaskStatus,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                       transition-colors"
            >
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={editedTask.priority}
              onChange={(e) =>
                setEditedTask({
                  ...editedTask,
                  priority: e.target.value as TaskPriority,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                       transition-colors"
            >
              {Object.values(TaskPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={editedTask.dueDate?.split('T')[0] || ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                setEditedTask({
                  ...editedTask,
                  dueDate: dateValue ? new Date(dateValue).toISOString() : '',
                });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                       transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => handleTagChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                       placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="Enter tags separated by commas"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                     rounded-md hover:bg-gray-50 dark:hover:bg-gray-700
                     focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                     transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white 
                     bg-blue-500 dark:bg-blue-600 border border-transparent 
                     rounded-md hover:bg-blue-600 dark:hover:bg-blue-700
                     focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                     transition-colors"
          >
            {task.id ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;