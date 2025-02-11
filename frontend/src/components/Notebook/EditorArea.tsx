import React, { useCallback } from 'react';
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

export const EditorArea: React.FC<EditorAreaProps> = ({
  editor,
  note,
  renderLeaf,
  onUpdate,
  onChange,
  insertCodeBlock,
  insertEquationBlock,
  insertInlineEquation,
}) => {
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (handleMarkdownConversion(editor, event)) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      
      const { selection } = editor;
      if (!selection) return;

      // Check if we're in a code block
      const [node] = Editor.parent(editor, selection);
      const isCodeBlock = (node as any).type === 'code-block';

      if (isCodeBlock) {
        if (!event.shiftKey) {
          // Insert 4 spaces
          Transforms.insertText(editor, '    ');
        } else {
          // Try to remove 4 spaces before cursor
          const currentPoint = selection.anchor;
          if (currentPoint.offset >= 4) {
            const start = { ...currentPoint, offset: currentPoint.offset - 4 };
            const range = { anchor: start, focus: currentPoint };
            const textBefore = Editor.string(editor, range);
            
            if (textBefore === '    ') {
              Transforms.delete(editor, { at: range });
            }
          }
        }
      } else {
        // Handle normal tab behavior for non-code blocks
        if (!event.shiftKey) {
          event.preventDefault();
          editor.insertText('\t');
        }
      }
    }
  }, [editor]);

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
