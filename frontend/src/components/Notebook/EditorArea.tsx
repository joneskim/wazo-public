import React, { useCallback, useState, useEffect } from 'react';
import { Editor, Transforms, Node, Path, createEditor, Element as SlateElement, Descendant } from 'slate';
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

// Create a safer version of Node.get that won't throw on invalid paths
const safeNodeGet = (editor: Editor, path: Path) => {
  try {
    if (path.length > 0 && Node.has(editor, path)) {
      return Node.get(editor, path);
    }
    return null;
  } catch (err) {
    console.warn('Error in safeNodeGet:', err);
    return null;
  }
};

// Enhance editor with error boundary for operations
const withErrorBoundary = (editor: Editor) => {
  const { apply, onChange } = editor;

  // Override apply to safely handle operations
  editor.apply = (operation) => {
    try {
      apply(operation);
    } catch (err) {
      console.error('Error applying operation:', operation, err);
      // Don't propagate the error, just log it
    }
  };

  // Add safety to onChange
  editor.onChange = () => {
    try {
      // Check if editor selection is valid
      const { selection } = editor;
      if (selection) {
        const isValid = 
          selection.anchor && 
          selection.focus && 
          safeNodeGet(editor, selection.anchor.path) !== null && 
          safeNodeGet(editor, selection.focus.path) !== null;

        if (!isValid) {
          // Reset to a safe selection
          Transforms.deselect(editor);
        }
      }
      onChange();
    } catch (err) {
      console.error('Error in editor onChange:', err);
      // Still call original onChange to maintain the contract
      onChange();
    }
  };

  return editor;
};

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
  const [error, setError] = useState<Error | null>(null);

  // Apply error boundary enhancement to editor
  useEffect(() => {
    withErrorBoundary(editor);
  }, [editor]);

  // Improved normalization with better path checking
  const normalizeEditorSelection = useCallback(() => {
    try {
      const { selection } = editor;
      if (selection) {
        // More thorough validity check
        const anchorNodeExists = safeNodeGet(editor, selection.anchor.path) !== null;
        const focusNodeExists = safeNodeGet(editor, selection.focus.path) !== null;
        
        if (!anchorNodeExists || !focusNodeExists) {
          // Find a valid selection point
          const points = Array.from(Node.descendants(editor))
            .filter(([node]) => Node.string(node).length > 0 || SlateElement.isElement(node))
            .map(([, path]) => path);
          
          if (points.length > 0) {
            // Select first valid point
            Transforms.select(editor, points[0]);
          } else if (editor.children.length > 0) {
            // Select start of document if no text nodes
            Transforms.select(editor, [0, 0]);
          } else {
            // Deselect as last resort
            Transforms.deselect(editor);
          }
        }
      }
    } catch (err) {
      console.error('Error normalizing selection:', err);
      Transforms.deselect(editor);
    }
  }, [editor]);

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
    } catch (err) {
      console.error('Error in keydown handler:', err);
      setHasError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
      // Prevent the error from crashing the editor
      event.preventDefault();
    }
  }, [editor]);

  useEffect(() => {
    if (hasError) {
      // Attempt to recover from the error
      try {
        normalizeEditorSelection();
      } catch (error) {
        console.error('Error recovering from error:', error);
      }
    }
  }, [hasError, editor, normalizeEditorSelection]);

  // Safe render leaf with additional checks for valid paths
  const safeRenderLeaf = useCallback((props: RenderLeafProps) => {
    try {
      // Check if the leaf is valid (we can't check path directly as it's not exposed in props)
      if (!props.leaf) {
        return <span {...props.attributes}>{props.children}</span>;
      }
      return renderLeaf(props);
    } catch (err) {
      console.error('Error in renderLeaf:', err);
      return <span {...props.attributes}>{props.children}</span>;
    }
  }, [renderLeaf]);

  // Wrap the onChange handler to catch errors
  const handleChange = useCallback((value: any) => {
    try {
      normalizeEditorSelection();
      onChange(value);
    } catch (err) {
      console.error('Error in onChange handler:', err);
      setHasError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [onChange, normalizeEditorSelection]);

  // Add a protected initialValue to ensure document structure
  const getInitialValue = useCallback((): Descendant[] => {
    try {
      const content = parseNoteContent(note.content);
      // Ensure there's at least a paragraph
      if (!content || content.length === 0) {
        return [{ 
          type: 'paragraph', 
          children: [{ text: '' }]
        }] as Descendant[];
      }
      
      // Ensure the content is properly typed as Descendant[]
      return content as Descendant[];
    } catch (error) {
      console.error('Error parsing note content:', error);
      // Return safe default
      return [{ 
        type: 'paragraph', 
        children: [{ text: '' }] 
      }] as Descendant[];
    }
  }, [note.content]);

  if (hasError) {
    return (
      <div>
        <h1>Error occurred in the editor</h1>
        <p>{error?.message || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 pt-0">
      <Slate
        editor={editor}
        initialValue={getInitialValue()}
        onChange={handleChange}
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
              renderLeaf={safeRenderLeaf}
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
