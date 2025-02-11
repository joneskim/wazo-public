import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      title: "Connected Thinking",
      description: "Create bi-directional links between notes and watch your knowledge network grow.",
      icon: "🔗"
    },
    {
      title: "Code Execution",
      description: "Run code snippets directly in your notes with support for multiple programming languages.",
      icon: "⚡️"
    },
    {
      title: "Task Management",
      description: "Track tasks and todos within your notes, keeping your projects organized and on schedule.",
      icon: "✓"
    },
    {
      title: "Knowledge Graph",
      description: "Visualize connections between your notes with an interactive graph view. (Coming Soon)",
      icon: "🌐"
    },
    {
      title: "Markdown Support",
      description: "Write in Markdown with support for code blocks, tables, and more.",
      icon: "📝"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Navigation */}
      <nav className={`fixed w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold">
                W
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                WazoNotes
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="text-sm px-4 py-2 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Request Access
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="py-20">
            <div className="max-w-2xl mx-auto text-center">
              <h1 
                className={`text-4xl font-bold text-gray-900 dark:text-white mb-6 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                More Than Just Notes
              </h1>
              <p 
                className={`text-lg text-gray-600 dark:text-gray-300 mb-8 transition-all duration-700 delay-200 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                A powerful workspace where you can write, code, and manage tasks. 
                Connect your thoughts and execute code in one seamless environment.
              </p>
              <div 
                className={`flex flex-col items-center space-y-4 transition-all duration-700 delay-400 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <Link
                  to="/register"
                  className="inline-block px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105"
                >
                  Request Beta Access
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Private beta - requires an invitation key
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 border-t border-gray-100 dark:border-gray-800">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg transition-all duration-300 ${
                    hoveredFeature === index ? 'bg-gray-50 dark:bg-gray-800 shadow-lg' : ''
                  } ${
                    isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}
                  style={{ 
                    transitionDelay: `${600 + index * 100}ms`,
                  }}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">{feature.icon}</span>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-sm font-bold">
                W
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date().getFullYear()} WazoNotes (Beta) - In Development
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
