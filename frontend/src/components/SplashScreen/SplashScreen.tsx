import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onClose: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
          <span className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xl font-bold mr-3">
            W
          </span>
          Welcome to WazoNotes! 🎉
        </h1>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Quick Start Guide
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create a new note using the <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">+ New Note</span> button</li>
              <li>Write your notes using Markdown syntax</li>
              <li>Use <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">[[Note Name]]</span> to link to other notes</li>
              <li>Add code blocks using triple backticks</li>
              <li>View your note connections in the Graph View</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Keyboard Shortcuts
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">⌘/Ctrl + N</span> New Note</div>
              <div><span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">⌘/Ctrl + S</span> Save Note</div>
              <div><span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">⌘/Ctrl + F</span> Search</div>
              <div><span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">⌘/Ctrl + G</span> Toggle Graph</div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Pro Tips
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use tags to organize your notes (e.g., #project, #idea)</li>
              <li>The graph view helps visualize connections between notes</li>
              <li>Click on backlinks to see notes that reference the current note</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 500);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
