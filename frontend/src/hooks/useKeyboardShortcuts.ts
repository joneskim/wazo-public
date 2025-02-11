import { useEffect } from 'react';

export interface ShortcutHandlers {
  onNewNote?: () => void;
  onToggleEdit?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onToggleGraph?: () => void;
  onToggleTasks?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Check if we're in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Check for meta key (Command on Mac, Control on Windows)
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            handlers.onNewNote?.();
            break;
          case 'e':
            event.preventDefault();
            handlers.onToggleEdit?.();
            break;
          case 'backspace':
            event.preventDefault();
            handlers.onDelete?.();
            break;
          case 'k':
            // Always prevent default for Cmd+K
            event.preventDefault();
            event.stopPropagation();
            handlers.onSearch?.();
            break;
          case 'g':
            event.preventDefault();
            handlers.onToggleGraph?.();
            break;
          case 't':
            event.preventDefault();
            handlers.onToggleTasks?.();
            break;
        }
      }
    }

    // Use capture phase to intercept the event before other handlers
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handlers]);
}
