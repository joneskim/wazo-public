import React, { useState } from 'react';

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [background, setBackground] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3002/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, background }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit form. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white z-[100]">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">wazo.space</h1>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href="https://github.com/your-username/wazo.space"
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="pt-14">
        {/* Project Overview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              An Open Source Knowledge Space
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              wazo.space is a work-in-progress application that uses AI to help you connect
              and organize your thoughts. It automatically discovers relationships between your notes,
              making knowledge management effortless.
            </p>
          </div>

          {/* Current Status */}
          <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Project Status
            </h3>
            <div className="space-y-3 text-gray-600">
              <p>🚧 Currently in active development</p>
              <p>✨ Core features being implemented:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>AI-powered note linking and relationship discovery</li>
                <li>Automatic suggestion of relevant connections</li>
                <li>Rich text editor with markdown support</li>
                <li>Knowledge graph visualization</li>
                <li>Full-text search with semantic understanding</li>
              </ul>
            </div>
          </div>

          {/* Beta Tester Form */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Join the Beta Program
            </h3>
            {submitted ? (
              <div className="text-green-600 text-center py-4">
                Thanks for your interest! We'll be in touch when the beta is ready.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="background" className="block text-sm font-medium text-gray-700">
                    What's your biggest challenge in organizing notes? (Optional)
                  </label>
                  <textarea
                    id="background"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Sign up for Beta Access
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            An open source project. Follow our progress on{' '}
            <a
              href="https://github.com/your-username/wazo.space"
              className="text-gray-900 hover:text-gray-700 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
