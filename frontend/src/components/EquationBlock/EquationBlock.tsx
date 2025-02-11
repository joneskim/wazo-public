import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Transforms, Path } from 'slate';
import { ReactEditor, RenderElementProps } from 'slate-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { EquationElement, CustomEditor } from '../../types/slate';

interface EquationBlockProps extends RenderElementProps {
  element: EquationElement;
  editor: CustomEditor;
}

export const EquationBlock: React.FC<EquationBlockProps> = ({
  attributes,
  children,
  element,
  editor,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [equation, setEquation] = useState(element.equation || '');
  const [error, setError] = useState<string | null>(null);

  // Keep local state in sync with element
  useEffect(() => {
    setEquation(element.equation || '');
  }, [element.equation]);

  // Update Slate node
  const updateNode = useCallback((newEquation: string) => {
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(
      editor,
      { equation: newEquation },
      { at: path }
    );
  }, [editor, element]);

  // Render equation with KaTeX
  const renderedEquation = useMemo(() => {
    if (!equation.trim()) return '';
    try {
      return katex.renderToString(equation || '\\sum_{i=1}^{10} x_i', {
        displayMode: true,
        throwOnError: false,
        output: 'html',
        trust: true,
        errorColor: '#ef4444',
      });
    } catch (error) {
      console.error('Error rendering equation:', error);
      setError((error as Error).message);
      return equation;
    }
  }, [equation]);

  // Handle text changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newEquation = e.target.value;
    setEquation(newEquation);
    setError(null);
  }, []);

  // Handle saving changes
  const handleSave = useCallback(() => {
    if (equation.trim()) {
      setIsEditing(false);
      updateNode(equation);
    }
  }, [equation, updateNode]);

  // Handle canceling changes
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEquation(element.equation || '');
    setError(null);
  }, [element.equation]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
      // Insert a new paragraph after saving
      const path = ReactEditor.findPath(editor, element);
      const newPath = Path.next(path);
      Transforms.insertNodes(
        editor,
        { type: 'paragraph', children: [{ text: '' }] },
        { at: newPath }
      );
      // Move cursor to the text node inside the new paragraph
      Transforms.select(editor, {
        path: [...newPath, 0],
        offset: 0
      });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const cursorPosition = target.selectionStart;
      const newEquation = 
        equation.substring(0, cursorPosition) + 
        '  ' + 
        equation.substring(cursorPosition);
      setEquation(newEquation);
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = cursorPosition + 2;
      }, 0);
    }
  }, [equation, handleSave, handleCancel, editor, element]);

  // Handle clicking outside
  const handleClickOutside = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.equation-block')) {
      handleSave();
    }
  }, [handleSave]);

  return (
    <div {...attributes}>
      <div 
        className="equation-block relative my-4"
        contentEditable={false}
      >
        {isEditing ? (
          <div 
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <textarea
              value={equation}
              onChange={handleChange}
              onBlur={handleClickOutside}
              onKeyDown={handleKeyDown}
              className="w-full p-2 text-black border border-gray-300 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 
                     focus:ring-blue-500 font-mono text-sm min-h-[100px] resize-none"
              autoFocus
              placeholder="Enter LaTeX equation... (Enter to save, Esc to cancel)"
              spellCheck={false}
            />
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div 
            className="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-text"
            onClick={() => setIsEditing(true)}
          >
            <div
              className="text-center katex-block dark:text-white text-gray-900"
              dangerouslySetInnerHTML={{ __html: renderedEquation }}
            />
            {error && (
              <div className="text-red-500 text-sm mt-2 text-center">
                Error rendering equation. Click to edit.
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
