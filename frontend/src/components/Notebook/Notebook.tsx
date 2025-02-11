import React, { useState, useCallback, useEffect, useMemo} from 'react';
import { Editor, Transforms, Element as SlateElement, Node, Descendant, createEditor, Path } from 'slate';
import { withReact, RenderElementProps, RenderLeafProps, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  parseNoteContent, 
  initialValue, 
  handleEnterInList,
  handleEnterInHeading
} from './notebookUtils';
import { 
  CustomElement, 
  ParagraphElement, 
  CodeBlockElement,
  EquationElement,
  InlineEquationElement
} from '../../types/slate';

import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDebouncedUpdate } from './hooks/useDebouncedUpdate';
import { MarkdownPasteHandler } from './MarkdownPasteHandler';
import { TOCAndEditor } from './TOCAndEditor';
import ElementRenderer from './ElementRenderer';
import LeafRenderer from './LeafRenderer';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { isEmptyParagraph } from './utils/paragraphUtils';
import { NotebookProps } from './types';
import { insertEquationBlock, insertInlineEquation } from './utils/equationUtils';

export const Notebook = React.memo(({ note, onUpdate, onDelete, onCreate }: NotebookProps) => {
  const [tableOfContents, setTableOfContents] = useState<any[]>([]);
  const [isTableOfContentsOpen, setIsTableOfContentsOpen] = useState(() => {
    const saved = localStorage.getItem('toc-open');
    return saved ? JSON.parse(saved) : true;
  });

  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const editor = useMemo(() => {
    const e = withHistory(withReact(createEditor()));
    
    const { insertData, insertBreak: originalInsertBreak, isInline, normalizeNode: originalNormalizeNode } = e;

    // Add custom normalizeNode to handle invalid states
    e.normalizeNode = entry => {
      const [node, path] = entry;
      
      // Ensure the editor always has at least one valid block
      if (Editor.isEditor(node) && node.children.length === 0) {
        Transforms.insertNodes(
          editor,
          { type: 'paragraph', children: [{ text: '' }] },
          { at: [0] }
        );
        return;
      }

      // Handle any other normalization
      originalNormalizeNode(entry);
    };

    // Override isInline to handle inline equations
    e.isInline = element => {
      return element.type === 'inline-equation' || isInline(element);
    };

    // Override the default insertBreak behavior
    e.insertBreak = () => {
      if (handleEnterInHeading(e)) {
        return;
      }
      
      if (handleEnterInList(e)) {
        return;
      }

      const [block] = Editor.above(e, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(e, n),
      }) || [];

      if (block) {
        const customBlock = block as CustomElement;
        if (customBlock.type === 'code-block') {
          Transforms.insertText(e, '\n');
          return;
        }
        if (customBlock.type === 'equation') {
          // Insert a new paragraph after the equation
          const path = ReactEditor.findPath(e, block);
          const newPath = Path.next(path);
          Transforms.insertNodes(
            e,
            { type: 'paragraph', children: [{ text: '' }] },
            { at: newPath }
          );
          Transforms.select(e, { path: [...newPath, 0], offset: 0 });
          return;
        }
      }

      originalInsertBreak();
    };
    
    // Add error handling for insertData
    e.insertData = data => {
      try {
        if (!data) return;
        
        const text = data.getData('text/plain');
        if (!text) {
          insertData(data);
          return;
        }
        
        // Handle code blocks with GitHub-style syntax
        if (text.includes('```')) {
          const lines = text.split('\n');
          let inCodeBlock = false;
          let language = '';
          let codeContent = '';
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('```')) {
              if (!inCodeBlock) {
                // Start of code block
                inCodeBlock = true;
                language = line.slice(3).trim() || 'python';
              } else {
                // End of code block
                const codeContentTrimmed = codeContent.trim();
                const codeBlock: CodeBlockElement = {
                  type: 'code-block',
                  language,
                  code: codeContentTrimmed,
                  children: [{ text: codeContentTrimmed }],
                };
                Transforms.insertNodes(e, codeBlock);
                Transforms.insertNodes(e, {
                  type: 'paragraph',
                  children: [{ text: '' }],
                } as CustomElement);
                
                inCodeBlock = false;
                codeContent = '';
              }
            } else if (inCodeBlock) {
              codeContent += line + '\n';
            } else {
              // Regular text outside code block
              Transforms.insertText(e, line + '\n');
            }
          }
          return;
        }
        
        insertData(data);
      } catch (error) {
        console.error('Error inserting data:', error);
        // Fallback to simple text insertion if rich insertion fails
        const text = data.getData('text/plain');
        if (text) {
          editor.insertText(text);
        }
      }
    };
    
    return e;
  }, []);

  const debouncedUpdate = useDebouncedUpdate({
    editor,
    onUpdate,
    delay: 500
  });

  const handleChange = useCallback((value: Descendant[]) => {
    const isAstChange = editor.operations.some(
      (op: { type: string }) => 'set_selection' !== op.type
    );

    if (isAstChange) {
      // Ensure there's always an empty line at the end
      const lastNode = editor.children[editor.children.length - 1] as CustomElement;
      if (!lastNode || !isEmptyParagraph(lastNode)) {
        const emptyParagraph: ParagraphElement = {
          type: 'paragraph',
          children: [{ text: '' }]
        };
        Transforms.insertNodes(
          editor,
          emptyParagraph,
          { at: [editor.children.length] }
        );
      }

      // Update table of contents
      updateTableOfContents();

      // Trigger save
      const content = JSON.stringify(value);
      debouncedUpdate(content);
    }
  }, [editor, debouncedUpdate]);

  useEffect(() => {
    if (note) {
      const content = note?.content ? parseNoteContent(note.content) : initialValue;
      
      // Add empty line if not present
      const lastNode = content[content.length - 1] as CustomElement;
      if (!lastNode || !isEmptyParagraph(lastNode)) {
        const emptyParagraph: ParagraphElement = {
          type: 'paragraph',
          children: [{ text: '' }]
        };
        content.push(emptyParagraph);
      }
      
      editor.children = content;
      
      // Update table of contents
      updateTableOfContents();
    }
  }, [note?.id, editor]);


  const renderElementWrapper = useCallback((props: RenderElementProps) => {
    return <ElementRenderer {...props} />;
  }, []);

  const renderLeafWrapper = useCallback((props: RenderLeafProps) => {
    return <LeafRenderer {...props} />;
  }, []);

  const updateTableOfContents = useCallback(() => {
    if (!editor) return;

    const nodes = Array.from(
      Editor.nodes(editor, {
        at: [],
        match: (n: Node) => 
          SlateElement.isElement(n) && 
          ['heading-one', 'heading-two', 'heading-three'].includes(n.type)
      })
    );

    const headings = nodes.map(([node, path]) => {
      const element = node as CustomElement;
      const depth = element.type === 'heading-one' ? 1 : 
                   element.type === 'heading-two' ? 2 : 3;
      return {
        text: Node.string(node),
        path: path,
        depth,
      };
    });

    setTableOfContents(headings);
  }, [editor]);

  useEffect(() => {
    if (!editor || !isTableOfContentsOpen) return;
    updateTableOfContents();
  }, [editor, updateTableOfContents, isTableOfContentsOpen]);

  useEffect(() => {
    localStorage.setItem('toc-open', JSON.stringify(isTableOfContentsOpen));
  }, [isTableOfContentsOpen]);

  const insertCodeBlock = useCallback(() => {
    const codeBlock: CodeBlockElement = {
      type: 'code-block',
      language: 'javascript',
      code: '',
      children: [{ text: '' }]
    };
    Transforms.insertNodes(editor, codeBlock);
  }, [editor]);

  const handleKeyDown = useKeyboardShortcuts({
    editor,
    insertCodeBlock,
    insertEquationBlock: () => {
      const equationBlock: EquationElement = {
        type: 'equation',
        equation: '\\sum_{i=1}^{10} x_i',
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, equationBlock);
      Transforms.move(editor);
    },
  });

  const render = useCallback(() => {
    return (
      <div className="h-full flex">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MarkdownPasteHandler editor={editor}>
            <TOCAndEditor
              editor={editor}
              note={note}
              tableOfContents={tableOfContents}
              isTableOfContentsOpen={isTableOfContentsOpen}
              renderElement={renderElementWrapper}
              renderLeaf={renderLeafWrapper}
              onUpdate={onUpdate}
              onChange={handleChange}
              insertCodeBlock={insertCodeBlock}
              insertEquationBlock={insertEquationBlock}
              insertInlineEquation={insertInlineEquation}
              setIsTableOfContentsOpen={setIsTableOfContentsOpen}
            />
          </MarkdownPasteHandler>
        </div>
      </div>
    );
  }, [
    editor,
    note,
    tableOfContents,
    isTableOfContentsOpen,
    renderElementWrapper,
    renderLeafWrapper,
    onUpdate,
    handleChange,
    insertCodeBlock,
    handleKeyDown,
  ]);

  useEffect(() => {
    localStorage.setItem('toc-width', '256');
  }, []);

  return (
    <KeyboardShortcuts editor={editor}>
      {render()}
    </KeyboardShortcuts>
  );
});
