import React, { useCallback, useState, useEffect } from 'react';
import { Editor, Transforms } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { Note } from '../../types/Note';
import { parseNoteContent } from './notebookUtils';
import { EditorToolbar } from './EditorToolbar';
import { handleMarkdownConversion } from './utils/markdownUtils';
import ElementRenderer from './ElementRenderer';

interface EditorAreaProps {
  editor: Editor;
  note: Note;
  renderLeaf: (props: RenderLeafProps) => JSX.Element;
  onUpdate: (updates: Partial<Note>) => void;
  onChange: (value: any) => void;
  insertCodeBlock: () => void;
  insertEquationBlock: (editor: Editor) => void;
  insertInlineEquation: (editor: Editor) => void;
}

const EditorArea: React.FC<EditorAreaProps> = ({
  editor,
  note,
  renderLeaf,
  onUpdate,
  onChange,
  insertCodeBlock,
  insertEquationBlock,
  insertInlineEquation,
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    try {
      if (handleMarkdownConversion(editor, event)) {
        event.preventDefault();
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        
        const { selection } = editor;
        if (!selection) return;

        try {
          // Check if we're in a code block
          const [node] = Editor.parent(editor, selection);
          const isCodeBlock = (node as any).type === 'code-block';

          if (isCodeBlock) {
            editor.insertText('  '); // Insert 2 spaces for tabs in code blocks
          } else {
            // Handle regular tab behavior
            editor.insertText('\t');
          }
        } catch (error) {
          console.error('Error handling tab:', error);
          // Fallback to simple tab insertion
          editor.insertText('\t');
        }
      }
    } catch (error) {
      console.error('Error in keydown handler:', error);
      setHasError(true);
      setError(error);
      // Prevent the error from crashing the editor
      event.preventDefault();
    }
  }, [editor]);

  useEffect(() => {
    if (hasError) {
      // Attempt to recover from the error
      try {
        // Reset the editor to its previous state
        editor.history.redo();
      } catch (error) {
        console.error('Error recovering from error:', error);
      }
    }
  }, [hasError, editor]);

  if (hasError) {
    return (
      <div>
        <h1>Error occurred in the editor</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 pt-0">
      <Slate
        editor={editor}
        initialValue={parseNoteContent(note.content)}
        onChange={value => {
          onChange(value);
        }}
      >
        <div className="sticky top-[3.5rem] z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <EditorToolbar
            editor={editor}
            insertCodeBlock={insertCodeBlock}
            insertEquationBlock={insertEquationBlock}
            insertInlineEquation={insertInlineEquation}
            tags={note.tags || '[]'}
            onTagsChange={(newTags) => {
              onUpdate({ tags: newTags });
            }}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 py-4 pt-20">
            <Editable
              renderElement={ElementRenderer}
              renderLeaf={renderLeaf}
              onKeyDown={handleKeyDown}
              className="min-h-full outline-none"
            />
          </div>
        </div>
      </Slate>
    </div>
  );
};

export default EditorArea;
