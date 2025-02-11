import React from 'react';
import { Note } from '../../types';
import { parseJsonArray } from '../../utils/jsonUtils';
import { TrashIcon } from '@heroicons/react/24/outline';

interface SearchResultProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
  showBacklinks: boolean;
  onDelete: (noteId: string) => void;
}

export const SearchResult: React.FC<SearchResultProps> = ({
  note,
  isSelected,
  onClick,
  showBacklinks,
  onDelete,
}) => {
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getContentPreview = (content: string): string => {
    try {
      const parsedContent = JSON.parse(content);
      const textContent = parsedContent
        .map((node: any) => {
          if (node.type === 'paragraph') {
            return node.children?.map((child: any) => child.text).join('') || '';
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');
      
      return truncateContent(textContent);
    } catch (error) {
      console.error('Error parsing note content for preview:', error);
      return '';
    }
  };

  const getFirstHeading = (content: string): string => {
    try {
      const parsedContent = JSON.parse(content);
      for (const node of parsedContent) {
        if (node.type && node.type.startsWith('heading-')) {
          return node.children?.[0]?.text || '';
        }
      }
      return '';
    } catch (error) {
      console.error('Error parsing note content for heading:', error);
      return '';
    }
  };

  const preview = note.content ? getContentPreview(note.content) : '';
  const heading = note.content ? getFirstHeading(note.content) : '';
  const backlinks = parseJsonArray(note.backlinks);
  const tags = parseJsonArray(note.tags);

  return (
    <div
      className={`p-4 cursor-pointer rounded-lg transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {heading || note.title || 'Untitled Note'}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(note.last_modified || new Date().toISOString()).toLocaleDateString()}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Delete note"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {preview || 'No content'}
        </p>
        {showBacklinks && backlinks && backlinks.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Referenced by: {backlinks.length} note
              {backlinks.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {backlinks.slice(0, 3).map((backlink, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {backlink}
                </span>
              ))}
              {backlinks.length > 3 && (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  +{backlinks.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
