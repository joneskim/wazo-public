import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { Task } from '../../types/task';
import { taskApi } from '../../api/taskApi';

interface TaskCalendarProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
  onTaskSelect?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onSelectTask, onTaskSelect, onTaskDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Load tasks if needed based on the current date
  }, [currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) =>
      isSameDay(new Date(task.dueDate), date)
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 flex-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
        {daysInMonth.map((day) => {
          const dayTasks = getTasksForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`bg-white dark:bg-gray-800 p-2 min-h-[100px] border-t border-l border-gray-200 dark:border-gray-700
                ${!isSameMonth(day, currentDate) ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}
            >
              <div className="font-medium">{format(day, 'd')}</div>
              <div className="mt-1 space-y-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask?.(task) || onTaskSelect?.(task)}
                    className="text-xs p-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 
                             rounded cursor-pointer truncate hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
