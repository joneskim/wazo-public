import React, { useState, useEffect, useCallback } from 'react';
import { Notebook } from './components/Notebook/Notebook'; // Fix import statement for Notebook component
import { Note } from './types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { NoteGraph } from './components/Graph';
import { SearchModal } from './components/Search/SearchModal';
import { Header } from './components/Header/Header'; // Import the correct Header component
import { Settings } from './components/Settings/Settings';
import { ThemeProvider } from './contexts/ThemeContext';
import { CodeBlockThemeProvider } from './contexts/CodeBlockThemeContext';
import { TaskView } from './components/Tasks/TaskView';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import axiosInstance from './services/axiosConfig'; // Import axios
import { isAxiosError } from 'axios';


interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selectedNoteId');
    return saved || null;
  });
  const [showSearch, setShowSearch] = useState(false);
  const [showGraph, setShowGraph] = useState<boolean>(() => {
    const savedGraphState = localStorage.getItem('showGraph');
    return savedGraphState === 'true';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  const { isAuthenticated } = useAuth();


  const handleCreateNote = useCallback(async () => {
    try {
      const response = await axiosInstance.post('/api/notes', {
        title: 'Untitled Note',
        content: JSON.stringify([
          {
            type: 'paragraph',
            children: [{ text: '' }],
          },
        ]),
      });

      if (!response.data) {
        throw new Error('No data received from create note API');
      }

      const createdNote = response.data;
      
      setNotes(prevNotes => [...prevNotes, createdNote]);
      setSelectedNoteId(createdNote.id);
      localStorage.setItem('selectedNoteId', createdNote.id);
      setShowSearch(false);

      return createdNote;
    } catch (error) {
      console.error('Error creating note:', error);
      if (isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
      }
      return null;
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      console.log('Fetching notes...');
      const response = await axiosInstance.get('/api/notes');
      console.log('Notes response:', response.data);

      if (!response.data) {
        console.error('No data received from notes API');
        return;
      }

      // Handle both array and object responses
      const notesList: Note[] = Array.isArray(response.data) 
        ? response.data 
        : response.data.notes || [];
      
      if (notesList.length === 0) {
        console.log('No notes found, creating initial note');
        // Create an initial note if none exist
        const initialNote = await handleCreateNote();
        if (initialNote) {
          notesList.push(initialNote);
        }
      }

      setNotes(notesList);
      
      // Get the last active note ID from local storage
      const lastActiveNoteId = localStorage.getItem('selectedNoteId');
      if (lastActiveNoteId && notesList.some((note: Note) => note.id === lastActiveNoteId)) {
        setSelectedNoteId(lastActiveNoteId);
      } else if (notesList.length > 0) {
        setSelectedNoteId(notesList[0].id);
        localStorage.setItem('selectedNoteId', notesList[0].id);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      if (isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
      }
    }
  }, [isAuthenticated, handleCreateNote]);

  // Fetch notes when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
    }
  }, [isAuthenticated, fetchNotes]);

  const handleUpdateNote = useCallback(async (updatedNote: Partial<Note>) => {
    if (!selectedNoteId) {
      console.error('No note selected for update');
      return;
    }
    
    const currentNote = notes.find(n => n.id === selectedNoteId);
    if (!currentNote) {
      console.error('Selected note not found:', selectedNoteId);
      return;
    }

    const mergedNote: Note = {
      ...currentNote,
      ...updatedNote,
      last_modified: new Date().toISOString()
    };

    console.log('Updating note:', mergedNote);

    try {
      const response = await axiosInstance.put(`/api/notes/${selectedNoteId}`, mergedNote);
      console.log('Update response:', response.data);

      if (!response.data) {
        throw new Error('No data received from update API');
      }

      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === selectedNoteId ? { ...mergedNote, ...response.data } : note
        )
      );
    } catch (error) {
      console.error('Error updating note:', error);
      if (isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
      }
      // Refresh notes list to ensure consistency
      fetchNotes();
    }
  }, [selectedNoteId, notes]);

  const handleSelectNote = useCallback(async (noteId: string) => {
    if (selectedNoteId === noteId) return; // Don't reselect the same note
    
    try {
      // Fetch the latest version of the note
      const response = await axiosInstance.get(`/api/notes/${noteId}`);
      if (response.data) {
        // Update the note in the notes array
        setNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === noteId ? { ...note, ...response.data } : note
          )
        );
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    }

    setSelectedNoteId(noteId);
    localStorage.setItem('selectedNoteId', noteId);
  }, [selectedNoteId, setNotes]);

  const handlePanelToggle = (panel: 'search' | 'settings' | 'tasks') => {
    // Close all other panels first
    if (panel !== 'search') setShowSearch(false);
    if (panel !== 'settings') setShowSettings(false);
    if (panel !== 'tasks') setShowTasks(false);

    // Toggle the requested panel
    switch (panel) {
      case 'search':
        setShowSearch(prev => !prev);
        break;
      case 'settings':
        setShowSettings(prev => !prev);
        break;
      case 'tasks':
        setShowTasks(prev => !prev);
        break;
    }
  };


  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await axiosInstance.delete(`/api/notes/${noteId}`);
      setNotes(notes.filter(note => note.id !== noteId));
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }, [notes, selectedNoteId]);

  const handleUpdateNoteSelection = useCallback(async (updatedNote: Partial<Note>) => {
    if (!selectedNoteId) return;
    
    const currentNote = notes.find(n => n.id === selectedNoteId);
    if (!currentNote) return;

    // Only send necessary fields to the backend
    const mergedNote = {
      ...currentNote,
      ...updatedNote,
      last_modified: new Date().toISOString()
    };

    try {
      // Only send the updated fields to the backend
      const updatePayload = {
        id: selectedNoteId,
        ...updatedNote,
        last_modified: new Date().toISOString()
      };
      
      await axiosInstance.put(`/api/notes/${selectedNoteId}`, updatePayload);

      // Update local state with the full merged note
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === selectedNoteId ? mergedNote : note
        )
      );
    } catch (error) {
      console.error('Error updating note:', error);
    }
  }, [axiosInstance, selectedNoteId, setNotes, notes]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onNewNote: handleCreateNote,
    onToggleGraph: () => setShowGraph(!showGraph),
    onSearch: () => handlePanelToggle('search'),
    onToggleTasks: () => handlePanelToggle('tasks')
  });

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Navigate to="/login" /> : <Navigate to="/app" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <div className="h-screen flex flex-col">
                <Header
                  onNewNote={handleCreateNote}
                  onToggleGraph={() => setShowGraph(!showGraph)}
                  onToggleSearch={() => handlePanelToggle('search')}
                  onToggleSettings={() => handlePanelToggle('settings')}
                  onToggleTasks={() => handlePanelToggle('tasks')}
                />
                
                <div className="flex-1 flex relative overflow-hidden bg-gray-50">
                  {/* Main Content */}
                  <div className={`w-full transition-transform duration-300 ease-in-out ${
                    showTasks || showSettings || showSearch ? 'translate-x-[-20%]' : 'translate-x-0'
                  }`}>
                    {showGraph ? (
                      <div className="h-[calc(100vh-3.5rem)]">
                        {selectedNote && (
                          <NoteGraph
                            currentNote={selectedNote}
                            notes={notes}
                            onNodeClick={handleSelectNote}
                            onUpdateNote={handleUpdateNoteSelection}
                          />
                        )}
                      </div>
                    ) : (
                      selectedNote && (
                        <Notebook
                          note={selectedNote}
                          onUpdate={handleUpdateNoteSelection}
                          onDelete={() => handleDeleteNote(selectedNote.id)}
                        />
                      )
                    )}
                  </div>

                  {/* Side Panels Container */}
                  <div className={`fixed top-[3.5rem] bottom-0 right-0 w-[40%] bg-gray-50 transition-transform duration-300 ease-in-out ${
                    showTasks || showSettings || showSearch ? 'translate-x-0' : 'translate-x-full'
                  }`}>
                    {/* Task Panel */}
                    <div className={`absolute inset-0 transition-transform duration-300 ease-in-out bg-gray-50 ${
                      showTasks ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                      <TaskView show={showTasks} />
                    </div>

                    {/* Settings Panel */}
                    <div className={`absolute inset-0 transition-transform duration-300 ease-in-out bg-gray-50 ${
                      showSettings ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                      <Settings show={showSettings} />
                    </div>

                    {/* Search Panel */}
                    <div className={`absolute inset-0 transition-transform duration-300 ease-in-out bg-gray-50 ${
                      showSearch ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                      <SearchModal
                        show={showSearch}
                        onClose={() => handlePanelToggle('search')}
                        notes={notes}
                        onNoteSelect={(noteId) => {
                          setSelectedNoteId(noteId);
                          localStorage.setItem('selectedNoteId', noteId);
                          handlePanelToggle('search');
                        }}
                        onDeleteNote={handleDeleteNote}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <CodeBlockThemeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </CodeBlockThemeProvider>
    </ThemeProvider>
  );
}

export default App;
