import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BasePanelProps {
  show: boolean;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const BasePanel: React.FC<BasePanelProps> = ({
  show,
  title,
  children,
  onClose
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="fixed inset-y-0 right-0 w-full flex">
          <div className="w-full">
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="flex-1 h-0 overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
