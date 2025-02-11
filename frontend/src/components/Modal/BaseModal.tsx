import React from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'default' | 'full';
  className?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'default',
  className = '' 
}) => {
  if (!isOpen) return null;

  const modalClasses = size === 'full' 
    ? `inline-block w-full h-full transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle ${className}`
    : `inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 ${className}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className={modalClasses}>
          {title && (
            <div className="mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
          )}
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default BaseModal;
