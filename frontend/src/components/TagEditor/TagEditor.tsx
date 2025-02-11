import React, { useState, useRef, useEffect } from 'react';
import { Tag, X, ChevronDown, Hash, Search } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';

interface TagEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  tags,
  onTagsChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputActive, setIsInputActive] = useState(false);
  const [selectedTagIndex, setSelectedTagIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentTags] = useState<string[]>(['research', 'todo', 'important', 'draft', 'idea']);

  // Group tags by prefix (e.g., "project/", "status/", etc.)
  const groupedTags = tags.reduce((acc, tag) => {
    const prefix = tag.includes('/') ? tag.split('/')[0] : 'other';
    return {
      ...acc,
      [prefix]: [...(acc[prefix] || []), tag]
    };
  }, {} as Record<string, string[]>);

  const handleInputFocus = () => {
    setIsInputActive(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsInputActive(false);
      setSelectedTagIndex(-1);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (selectedTagIndex >= 0 && suggestions[selectedTagIndex]) {
        addTag(suggestions[selectedTagIndex]);
      } else {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      const nextIndex = (selectedTagIndex + 1) % suggestions.length;
      setSelectedTagIndex(nextIndex);
    } else if (e.key === 'Escape') {
      setIsInputActive(false);
      inputRef.current?.blur();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const addTag = (newTag: string) => {
    if (!tags.includes(newTag)) {
      onTagsChange([...tags, newTag]);
      setInputValue('');
      setSelectedTagIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const updateSuggestions = (value: string) => {
    const input = value.toLowerCase();
    if (!input) {
      setSuggestions(recentTags.filter(tag => !tags.includes(tag)));
      return;
    }

    const matchingTags = [
      ...recentTags,
      'project/personal', 'project/work',
      'status/active', 'status/completed',
      'priority/high', 'priority/medium', 'priority/low',
      'type/note', 'type/task', 'type/reference'
    ].filter(tag => 
      tag.toLowerCase().includes(input) && !tags.includes(tag)
    );

    setSuggestions(matchingTags);
  };

  useEffect(() => {
    updateSuggestions(inputValue);
  }, [inputValue, tags]);

  return (
    <div className="relative flex flex-col">
      {/* Main Input Area */}
      <div 
        className={`flex items-center gap-2 p-1 rounded-lg border ${
          isInputActive 
            ? 'border-blue-0 dark:border-blue-500 ring-2 ring-blue-50 dark:ring-blue-900/30' 
            : 'border-white dark:border-gray-900'
        } bg-white dark:bg-gray-900 transition-all duration-150`}
      >
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          <AnimatePresence>
            {Object.entries(groupedTags).map(([prefix, groupTags]) => (
              <motion.div
                key={prefix}
                className="flex items-center gap-1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {groupTags.map((tag, index) => (
                  <motion.span
                    key={tag}
                    className={`
                      inline-flex items-center h-6 pl-2 pr-1 rounded-md text-xs font-medium
                      ${prefix === 'other' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-0 dark:border-blue-900'
                        : 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                      }
                      whitespace-nowrap group transition-all duration-150 hover:pr-2
                    `}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-violet-100 dark:hover:bg-violet-800/50 rounded-sm transition-all duration-150"
                    >
                      <X size={12} className="text-violet-500 dark:text-violet-400" />
                    </button>
                  </motion.span>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex items-center min-w-[120px]">
            <Hash size={14} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={tags.length > 0 ? "Add another tag..." : "Add tags..."}
              className="w-full px-1.5 py-0.5 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isInputActive && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
          >
            <div className="px-2 pb-1 mb-1 border-b border-gray-100 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Suggestions
              </div>
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className={`
                  w-full px-2 py-1 text-sm text-left flex items-center gap-2
                  ${selectedTagIndex === index ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                  transition-colors duration-150
                `}
              >
                <Hash size={12} className="text-gray-400" />
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
