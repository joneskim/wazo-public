import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Replace these with your actual EmailJS service ID, template ID, and public key
      const serviceId = 'service_38onklx';
      const templateId = 'template_sesblfl';
      const publicKey = 'Os60mK05_O5TFWQYi';
      
      const templateParams = {
        to_email: 'joneskimaminiel@gmail.com',
        from_email: email,
        message: `New interest in w4zo from: ${email}`,
      };
      
      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );
      
      if (response.status === 200) {
        setSubmitted(true);
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-white shadow-sm z-[100]">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">w4zo</h1>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/joneskim/wazo-public"
            className="py-2 px-4 text-gray-700 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100 flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <main className="pt-24 pb-16 flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your AI-Enhanced Second Brain
            </h2>
            <p className="text-lg text-gray-600 mx-auto">
              W4ZO helps you organize your notes and discover connections using AI
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 py-5 px-6">
              <h3 className="text-xl font-semibold text-white">
                Stay Updated
              </h3>
              <p className="text-indigo-100 text-sm mt-1">
                Get notified when we launch
              </p>
            </div>
            <div className="p-6">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-1">Thanks!</h4>
                  <p className="text-sm text-gray-600">We'll let you know when we're ready.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <div className="flex">
                      <input
                        type="email"
                        id="email"
                        required
                        className="flex-1 px-3 py-2 rounded-l-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium disabled:opacity-70"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending
                          </span>
                        ) : 'Notify Me'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-medium text-gray-900 mb-3">Key Features:</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> 
                AI note connections
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> 
                Knowledge graphs
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> 
                Smart editor
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span> 
                Code blocks
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto py-4 px-6 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} w4zo | 
            <a
              href="https://github.com/joneskim/wazo-public"
              className="ml-2 text-gray-600 hover:text-gray-900 transition-colors"
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
