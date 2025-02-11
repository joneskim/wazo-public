import { useCallback } from 'react';
import { Editor, Range, Transforms, Text, Element } from 'slate';
import { ReactEditor } from 'slate-react';
import isHotkey from 'is-hotkey';
import { HOTKEYS, toggleMark } from '../notebookUtils';
import { CustomElement, BulletedListElement } from '../../../types/slate';
import { handleMarkdownConversion } from '../utils/markdownUtils';

interface UseKeyboardShortcutsProps {
  editor: Editor;
  insertCodeBlock: () => void;
  insertEquationBlock: (editor: Editor) => void;
}

export function useKeyboardShortcuts({
  editor,
  insertCodeBlock,
  insertEquationBlock,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!editor.selection) return;

      // Try markdown conversion first
      if (handleMarkdownConversion(editor, event)) {
        return;
      }

      // Handle keyboard shortcuts for code block and equation
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '`':
            event.preventDefault();
            insertCodeBlock();
            break;
          case 'e':
            event.preventDefault();
            insertEquationBlock(editor);
            break;
        }
      }

      // Handle hotkeys for marks
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, event as any)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey];
          toggleMark(editor, mark);
        }
      }

      // Handle space for bold text conversion
      if (event.key === ' ') {
        const { selection } = editor;
        if (!selection || !Range.isCollapsed(selection)) return;

        const [node] = Editor.node(editor, selection);
        if (!Text.isText(node)) return;

        const text = node.text;
        const beforeCursor = text.slice(0, selection.focus.offset);
        const boldPattern = /\*\*([^*]+)\*\*(?![*])/;
        const match = beforeCursor.match(boldPattern);

        if (match) {
          event.preventDefault();
          const [fullMatch, content] = match;
          const start = beforeCursor.lastIndexOf(fullMatch);
          const nodePath = ReactEditor.findPath(editor, node);
          const boldRange = {
            anchor: { path: nodePath, offset: start },
            focus: { path: nodePath, offset: start + fullMatch.length },
          };

          Transforms.delete(editor, { at: boldRange });
          Transforms.insertNodes(editor, { text: content, bold: true });
          Transforms.insertNodes(editor, { text: ' ' });
          return;
        }
      }

      // Handle Enter key for markdown conversion
      if (event.key === 'Enter' && !event.shiftKey) {
        const { selection } = editor;
        if (!selection || !Range.isCollapsed(selection)) return;

        const [node] = Editor.node(editor, selection);
        if (!Element.isElement(node)) return;

        const start = Editor.start(editor, selection);
        const range = { anchor: start, focus: selection.focus };
        const text = Editor.string(editor, range);

        // Handle list conversion
        const listMatch = text.match(/^[-*]\s(.+)/);
        if (listMatch) {
          event.preventDefault();
          const [, content] = listMatch;

          Transforms.delete(editor, { at: range });
          Transforms.setNodes(
            editor,
            { type: 'list-item' } as Partial<CustomElement>,
            { match: (n) => Element.isElement(n) && n.type === 'paragraph' }
          );
          const list: BulletedListElement = { 
            type: 'bulleted-list', 
            children: []
          };
          Transforms.wrapNodes(editor, list, {
            match: (n) => Element.isElement(n) && n.type === 'list-item',
          });
          editor.insertText(content);
          return;
        }
      }

      // Handle $ for equation insertion
      if (event.key === '$') {
        const { selection } = editor;
        if (!selection || !Range.isCollapsed(selection)) return;

        const [node] = Editor.node(editor, selection);
        if (!Text.isText(node)) return;

        const text = node.text;
        const beforeCursor = text.slice(0, selection.focus.offset);

        // Check if we're typing a second $
        if (beforeCursor.endsWith('$')) {
          event.preventDefault();
          const nodePath = ReactEditor.findPath(editor, node);
          const start = selection.focus.offset - 1;
          const equationRange = {
            anchor: { path: nodePath, offset: start },
            focus: { path: nodePath, offset: start + 1 },
          };

          Transforms.delete(editor, { at: equationRange });
          insertEquationBlock(editor);
          return;
        }
      }

      // Handle Backspace for empty line
      if (event.key === 'Backspace') {
        const { selection } = editor;
        if (!selection || !Range.isCollapsed(selection)) return;

        const [node] = Editor.node(editor, selection);
        if (!Element.isElement(node)) return;

        if (
          Editor.isStart(editor, selection.focus, selection.focus.path) &&
          node.type !== 'paragraph' &&
          Editor.isEmpty(editor, node)
        ) {
          event.preventDefault();
          Transforms.setNodes(editor, { type: 'paragraph' } as Partial<CustomElement>);
          return;
        }
      }
    },
    [editor, insertCodeBlock, insertEquationBlock]
  );

  return handleKeyDown;
}
