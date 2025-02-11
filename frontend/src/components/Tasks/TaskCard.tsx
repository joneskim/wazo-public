import React from 'react';
import { Task, TaskStatus, taskPriorityColors, taskStatusColors, taskPriorityTextColors, taskStatusTextColors } from '../../types/task';
import { TrashIcon, PencilIcon, LinkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onLink?: (taskId: string) => void;
  className?: string;
}

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onLink,
  className = '',
}: TaskCardProps) => {
  const formattedDate = task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '';
  const tags = Array.isArray(task.tags) ? task.tags : [];

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newStatus = (() => {
      switch (task.status) {
        case TaskStatus.TODO:
          return TaskStatus.IN_PROGRESS;
        case TaskStatus.IN_PROGRESS:
          return TaskStatus.COMPLETED;
        case TaskStatus.COMPLETED:
          return TaskStatus.TODO;
        default:
          return TaskStatus.TODO;
      }
    })();

    onEdit({
      ...task,
      status: newStatus,
      last_modified: new Date().toISOString()
    });
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 
                 hover:border-gray-300 dark:hover:border-gray-600 transition-colors ${className}`}
      onDoubleClick={handleDoubleClick}
      style={{ 
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <div className="p-3 space-y-2">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
            {task.title}
          </h3>
          <div className="flex gap-1 ml-2">
            {onLink && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLink(task.id);
                }}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Link to note"
              >
                <LinkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Edit task"
            >
              <PencilIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Delete task"
            >
              <TrashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Description - only show if present */}
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium
                       ${taskPriorityColors[task.priority]} ${taskPriorityTextColors[task.priority]}`}
            >
              {task.priority.toLowerCase()}
            </span>
            {tags.length > 0 && (
              <div className="flex gap-1">
                {tags.slice(0, 2).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 
                             text-gray-600 dark:text-gray-400 text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="text-gray-400 dark:text-gray-500">+{tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
          {formattedDate && (
            <span className="text-gray-400 dark:text-gray-500">{formattedDate}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
