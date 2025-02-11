import React, { useState } from 'react';
import { Task, TaskStatus, taskStatusColors, taskStatusTextColors, TaskPriority } from '../../types/task';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, Search } from 'react-feather';
import TaskCard from './TaskCard';
import TaskEditModal from './TaskEditModal';
import { Button } from '../Notebook/EditorComponents';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onCreateTask,
  onUpdateTask,
  filter,
  onFilterChange,
}) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(filter.toLowerCase()) ||
      task.description.toLowerCase().includes(filter.toLowerCase()) ||
      task.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  const tasksByStatus = {
    [TaskStatus.TODO]: filteredTasks.filter((task) => task.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS
    ),
    [TaskStatus.COMPLETED]: filteredTasks.filter((task) => task.status === TaskStatus.COMPLETED),
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    onUpdateTask(draggableId, {
      status: destination.droppableId as TaskStatus,
      last_modified: new Date().toISOString()
    });
  };

  const handleCreateTask = () => {
    const newTask: Task = {
      id: '', // Will be set by backend
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date().toISOString(),
      tags: [],
      linkedNoteIds: [],
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString()
    };
    setEditingTask(newTask);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Create Bar */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 
                     rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                     placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        <Button
          onClick={handleCreateTask}
          title="New Task"
          className="bg-dark-500 dark:bg-dark-600 hover:bg-dark-600 dark:hover:bg-blue-700 text-black"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 px-4 pb-4">
          {Object.entries(tasksByStatus).map(([status, tasks]) => (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col h-full rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {status.replace('_', ' ')}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {tasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Task Cards */}
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <TaskCard
                              task={task}
                              onEdit={setEditingTask}
                              onDelete={onDeleteTask}
                              className={`${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={(task) => {
            if (task.id) {
              onEditTask(task);
            } else {
              onCreateTask(task);
            }
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};

export default TaskList;
