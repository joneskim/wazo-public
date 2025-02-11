import React from 'react';
import { TaskManager } from './TaskManager';

interface TaskViewProps {
  show: boolean;
}

export const TaskView: React.FC<TaskViewProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="h-full border-l border-gray-200 flex flex-col">
      <TaskManager />
    </div>
  );
};
