import React from 'react';
import { Editor } from 'slate';
import isHotkey from 'is-hotkey';
import { HOTKEYS, toggleMark } from './notebookUtils';

interface KeyboardShortcutsProps {
  editor: Editor;
  children: React.ReactNode;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ editor, children }) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    let handled = false;

    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event as any)) {
        event.preventDefault();
        const mark = HOTKEYS[hotkey];
        toggleMark(editor, mark);
        handled = true;
        break;
      }
    }

    // Only stop propagation if we handled the event
    if (handled) {
      event.stopPropagation();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
};
