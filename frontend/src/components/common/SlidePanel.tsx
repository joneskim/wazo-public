import React from 'react';
import { X } from 'react-feather';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className={`fixed inset-y-0 right-0 w-[45rem] bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
      
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity z-40"
        onClick={onClose}
      />
    </>
  );
};
