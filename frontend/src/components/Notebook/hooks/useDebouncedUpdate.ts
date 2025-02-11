import { useCallback, useRef, useEffect } from 'react';
import { Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { debounce } from '../notebookUtils';
import { Note } from '../../../types/Note';

interface UseDebouncedUpdateProps {
  editor: Editor;
  onUpdate: (note: Partial<Note>) => void;
  delay?: number;
}

export function useDebouncedUpdate({ editor, onUpdate, delay = 500 }: UseDebouncedUpdateProps) {
  const debouncedUpdateRef = useRef<NodeJS.Timeout>();

  const debouncedUpdate = useCallback(
    debounce((content: string) => {
      const currentSelection = editor.selection;
      onUpdate({ content });
      
      // Restore selection after update
      if (currentSelection && ReactEditor.isFocused(editor)) {
        ReactEditor.focus(editor);
        Transforms.select(editor, currentSelection);
      }
    }, delay),
    [editor, onUpdate, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, []);

  return debouncedUpdate;
}
