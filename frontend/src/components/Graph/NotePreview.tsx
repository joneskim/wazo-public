import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon, Calendar, Clock, Link as LinkIcon } from 'react-feather';
import { Note } from '../../types';
import { getNoteTitle, getNotePreview } from '../../utils/noteUtils';
import { parseJsonArray } from '../../utils/jsonUtils';

interface NotePreviewProps {
  note: Note;
  onRemove?: () => void;
  onClick?: () => void;
  showAddIcon?: boolean;
  isInteractive?: boolean;
  type?: 'current' | 'reference' | 'backlink' | 'tag' | 'tagCluster';
}

const NotePreview: React.FC<NotePreviewProps> = ({
  note,
  onRemove,
  onClick,
  showAddIcon = false,
  isInteractive = true,
  type = 'reference',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  React.useEffect(() => {
    if (isHovered) {
      setPreviewContent(getNotePreview(note.content));
    }
  }, [isHovered, note.content]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'current':
        return 'border-blue-400 text-blue-900 dark:text-blue-100';
      case 'reference':
        return 'border-green-400 text-emerald-900 dark:text-emerald-100';
      case 'backlink':
        return 'border-amber-400 text-amber-900 dark:text-amber-100';
      case 'tag':
        return 'border-indigo-400 text-indigo-900 dark:text-indigo-100';
      default:
        return 'border-gray-200 text-gray-900 dark:text-gray-100 dark:border-gray-700';
    }
  };

  const tags = parseJsonArray(note.tags);
  const references = parseJsonArray(note.references);

  return (
    <div
      className={`
        relative p-4 border-[1.5px] rounded-xl
        bg-white dark:bg-gray-900
        transition-all duration-200
        ${getColors()}
        ${isInteractive ? 'hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-950/30 cursor-pointer' : ''}
        backdrop-blur-sm backdrop-saturate-150
      `}
      style={{
        boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {getNoteTitle(note.content)}
          </span>
          <div className="flex items-center gap-2">
            {showAddIcon && (
              <Plus
                size={16}
                className="text-emerald-500 hover:text-emerald-600 transition-colors"
              />
            )}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="text-red-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {isHovered && previewContent && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
            {previewContent}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="
                  inline-flex items-center text-xs px-2 py-0.5 
                  rounded-full font-medium
                  bg-gray-100 dark:bg-white/10 
                  text-gray-600 dark:text-gray-300
                  transition-colors hover:bg-gray-200 dark:hover:bg-white/20
                "
              >
                <TagIcon size={10} className="mr-1 opacity-70" />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            {note.created_at && (
              <span className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <Calendar size={12} className="opacity-70" />
                {formatDate(note.created_at)}
              </span>
            )}
            {note.last_modified && (
              <span className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <Clock size={12} className="opacity-70" />
                {formatDate(note.last_modified)}
              </span>
            )}
          </div>
          
          {references.length > 0 && (
            <span className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <LinkIcon size={12} className="opacity-70" />
              {references.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotePreview;
