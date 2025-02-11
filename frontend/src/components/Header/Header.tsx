import React from 'react';
import { Settings } from '../Settings/Settings';
import { 
  PlusIcon, 
  Cog6ToothIcon, 
  MagnifyingGlassIcon, 
  ListBulletIcon, 
  ChartBarIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '../CodeBlock/icons';

interface HeaderProps {
  onNewNote: () => void;
  onToggleGraph: () => void;
  onToggleSearch: () => void;
  onToggleSettings: () => void;
  onToggleTasks: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewNote,
  onToggleGraph,
  onToggleSearch,
  onToggleSettings,
  onToggleTasks,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-[100]`}>
      <div className="flex items-center space-x-2">
        <button
          onClick={onNewNote}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSearch}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleGraph}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChartBarIcon className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleTasks}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ListBulletIcon className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleSettings}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle theme"
        >
          {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
        </button>

        <button
          onClick={handleLogout}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
