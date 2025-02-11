import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Note } from '../../types';
import { SearchResult } from './SearchResult';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { BasePanel } from '../common/BasePanel';
import { parseJsonArray } from '../../utils/jsonUtils';

interface SearchModalProps {
  show: boolean;
  onClose: () => void;
  notes: Note[];
  onNoteSelect: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  show,
  onClose,
  notes,
  onNoteSelect,
  onDeleteNote,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate tag statistics
  const tagStats = useMemo(() => {
    const stats = new Map<string, number>();
    notes.forEach(note => {
      const tags = parseJsonArray(note.tags);
      tags.forEach(tag => {
        stats.set(tag, (stats.get(tag) || 0) + 1);
      });
    });
    return Array.from(stats.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [notes]);

  // Filter and sort search results
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      // Show all notes when no query, sorted by last modified
      return notes
        .map(note => ({ item: note }))
        .sort((a, b) => 
          new Date(b.item.last_modified || new Date().toISOString()).getTime() - 
          new Date(a.item.last_modified || new Date().toISOString()).getTime()
        );
    }

    const terms = query.toLowerCase().split(' ');
    const tagTerms = terms.filter(term => term.startsWith('#')).map(term => term.slice(1));
    const textTerms = terms.filter(term => !term.startsWith('#'));

    return notes
      .map(note => {
        let score = 0;

        // Check tag matches
        if (tagTerms.length > 0) {
          const noteTags = parseJsonArray(note.tags).map(tag => tag.toLowerCase());
          const matchingTags = tagTerms.filter(tag => noteTags.includes(tag));
          if (matchingTags.length === 0 && textTerms.length > 0) return null;
          score += matchingTags.length * 10;
        }

        // Check text matches
        if (textTerms.length > 0) {
          const noteContent = (note.content || '').toLowerCase();
          const matchingTerms = textTerms.filter(term => noteContent.includes(term));
          
          if (matchingTerms.length === 0 && tagTerms.length === 0) return null;
          
          score += matchingTerms.length;
          
          // Try to match against headings for higher score
          try {
            const parsedContent = JSON.parse(note.content || '[]');
            const headings = parsedContent
              .filter((node: any) => node.type?.startsWith('heading-'))
              .map((node: any) => node.children?.[0]?.text || '')
              .join(' ')
              .toLowerCase();
            
            matchingTerms.forEach(term => {
              if (headings.includes(term)) {
                score += 5;
              }
            });
          } catch (error) {
            console.error('Error parsing note content for headings:', error);
          }
        }

        return score > 0 ? { item: note, score } : null;
      })
      .filter((result): result is { item: Note; score: number } => result !== null)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => ({ item }));
  }, [notes, query]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!show) {
      setQuery('');
      setSelectedIndex(-1);
    }
  }, [show]);

  // Focus input when modal is shown
  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      onNoteSelect(searchResults[selectedIndex].item.id);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const addTagToSearch = (tag: string) => {
    setQuery(prev => {
      const terms = prev.split(' ').filter(term => !term.startsWith('#'));
      return [...terms, `#${tag}`].join(' ').trim();
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleNoteSelect = (noteId: string) => {
    onNoteSelect(noteId);
    onClose();
  };

  return (
    <BasePanel
      show={show}
      title="Search Notes"
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search notes... (⌘K)"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              autoFocus
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {/* Tag suggestions */}
          {tagStats.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {tagStats.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => addTagToSearch(tag)}
                    className="px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 
                             bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <span>{tag}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {searchResults.map((result, index) => (
            <SearchResult
              key={result.item.id}
              note={result.item}
              isSelected={index === selectedIndex}
              onClick={() => handleNoteSelect(result.item.id)}
              showBacklinks={true}
              onDelete={onDeleteNote}
            />
          ))}
          {searchResults.length === 0 && query.trim() && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No notes found matching your search
            </div>
          )}
        </div>
      </div>
    </BasePanel>
  );
};
