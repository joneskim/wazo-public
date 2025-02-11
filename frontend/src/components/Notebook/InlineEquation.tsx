import React, { useState, useCallback } from 'react';
import { Transforms } from 'slate';
import { useSlate, ReactEditor, RenderElementProps } from 'slate-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { InlineEquationElement } from '../../types/slate';

interface InlineEquationProps extends RenderElementProps {
  element: InlineEquationElement;
}

export const InlineEquation: React.FC<InlineEquationProps> = ({ attributes, children, element }) => {
  const editor = useSlate();
  const [isEditing, setIsEditing] = useState(false);
  const [equation, setEquation] = useState(element.equation || '');

  const renderedEquation = React.useMemo(() => {
    if (!equation) return '';
    try {
      return katex.renderToString(equation, {
        displayMode: false,
        throwOnError: false,
        strict: false
      });
    } catch (error) {
      console.error('KaTeX error:', error);
      return 'Invalid LaTeX equation';
    }
  }, [equation]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes<InlineEquationElement>(
      editor,
      { equation },
      { at: path }
    );
  }, [editor, element, equation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  }, [handleBlur]);

  return (
    <span 
      {...attributes}
      contentEditable={false}
      className="inline-block align-middle"
    >
      {isEditing ? (
        <input
          type="text"
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-sm 
                   bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 
                   focus:ring-blue-500"
          autoFocus
          style={{ 
            minWidth: '60px', 
            width: `${equation.length + 2}ch`,
            display: 'inline-block',
            verticalAlign: 'baseline'
          }}
          placeholder="Enter LaTeX equation..."
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className="inline-block px-1 py-0.5 bg-gray-50 dark:bg-gray-800 rounded 
                   cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
          dangerouslySetInnerHTML={{ __html: renderedEquation }}
        />
      )}
      {children}
    </span>
  );
};
