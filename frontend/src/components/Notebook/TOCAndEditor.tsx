import React from 'react';
import { Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { TableOfContents } from './TableOfContents';
import  EditorArea  from './EditorArea';
import { Note } from '../../types/Note';
import { RenderElementProps, RenderLeafProps } from 'slate-react';
import { ChevronLeft, ChevronRight } from 'react-feather';

interface TOCAndEditorProps {
  editor: Editor;
  note: Note;
  tableOfContents: any[];
  isTableOfContentsOpen: boolean;
  renderElement: (props: RenderElementProps) => JSX.Element;
  renderLeaf: (props: RenderLeafProps) => JSX.Element;
  onUpdate: (updates: Partial<Note>) => void;
  onChange: (value: any) => void;
  insertCodeBlock: () => void;
  insertEquationBlock: (editor: Editor) => void;
  insertInlineEquation: (editor: Editor) => void;
  setIsTableOfContentsOpen: (value: boolean) => void;
}

export const TOCAndEditor: React.FC<TOCAndEditorProps> = ({
  editor,
  note,
  tableOfContents,
  isTableOfContentsOpen,
  renderElement,
  renderLeaf,
  onUpdate,
  onChange,
  insertCodeBlock,
  insertEquationBlock,
  insertInlineEquation,
  setIsTableOfContentsOpen,
}) => {
  return (
    <div className="flex flex-1 min-w-0 h-screen pt-14">
      {/* Table of Contents */}
      <div 
        className={`fixed left-0 top-[3.5rem] bottom-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 
          transition-all duration-200 ${isTableOfContentsOpen ? 'w-64' : 'w-10'}`}
        role="complementary"
        aria-label="Table of contents navigation"
      >
        {/* TOC Header */}
        <div className="flex-none p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
          <button 
            onClick={() => setIsTableOfContentsOpen(!isTableOfContentsOpen)}
            className="w-full flex items-center justify-center p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={isTableOfContentsOpen ? "Collapse Table of Contents" : "Expand Table of Contents"}
            aria-expanded={isTableOfContentsOpen}
            aria-controls="table-of-contents"
          >
            {isTableOfContentsOpen ? (
              <ChevronLeft className="h-4 w-4 text-gray-500" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* TOC Content */}
        <div className={`flex-1 overflow-y-auto ${!isTableOfContentsOpen ? 'hidden' : ''}`}>
          <div className="p-4">
            <TableOfContents 
              items={tableOfContents}
              editor={editor}
              onItemClick={(path) => {
                try {
                  const point = { path: [...path, 0], offset: 0 };
                  Transforms.select(editor, {
                    anchor: point,
                    focus: point,
                  });
                  ReactEditor.focus(editor);
                  
                  try {
                    const domNode = ReactEditor.toDOMNode(editor, Editor.node(editor, path)[0]);
                    if (domNode) {
                      domNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  } catch (scrollError) {
                    console.error('Error scrolling to heading:', scrollError);
                  }
                } catch (error) {
                  console.error('Error selecting heading:', error);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className={`flex-1 flex flex-col min-w-0 ${isTableOfContentsOpen ? 'ml-64' : 'ml-10'}`}>
        <EditorArea
          editor={editor}
          note={note}
          renderLeaf={renderLeaf}
          onUpdate={onUpdate}
          onChange={onChange}
          insertCodeBlock={insertCodeBlock}
          insertEquationBlock={insertEquationBlock}
          insertInlineEquation={insertInlineEquation}
        />
      </div>
    </div>
  );
};
