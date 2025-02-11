import { useState, useCallback, RefObject } from 'react';
import { Note } from '../types';

export function useNoteLinking(
  editorRef: RefObject<HTMLTextAreaElement>,
  notes: Map<string, Note>
) {
  const [showSuggester, setShowSuggester] = useState(false);
  const [suggesterPosition, setSuggesterPosition] = useState({ x: 0, y: 0 });
  const [linkQuery, setLinkQuery] = useState('');

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    const value = editorRef.current.value;
    const cursorPos = editorRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastOpenBrackets = textBeforeCursor.lastIndexOf('[[');

    if (lastOpenBrackets !== -1 && !textBeforeCursor.includes(']]', lastOpenBrackets)) {
      const query = textBeforeCursor.substring(lastOpenBrackets + 2);
      setLinkQuery(query);

      // Get cursor position for suggester
      const textArea = editorRef.current;
      const cursorCoords = getCaretCoordinates(textArea, cursorPos);
      
      setSuggesterPosition({
        x: cursorCoords.left,
        y: cursorCoords.top
      });
      setShowSuggester(true);
    } else {
      setShowSuggester(false);
    }
  }, []);

  const insertNoteLink = useCallback((noteId: string, title: string) => {
    if (!editorRef.current) return;

    const cursorPos = editorRef.current.selectionStart;
    const value = editorRef.current.value;
    const lastOpenBrackets = value.lastIndexOf('[[', cursorPos);

    if (lastOpenBrackets !== -1) {
      const textBefore = value.substring(0, lastOpenBrackets);
      const textAfter = value.substring(cursorPos);
      const link = `[[${noteId}|${title}]]`;
      const newValue = textBefore + link + textAfter;

      editorRef.current.value = newValue;
      const newCursorPos = lastOpenBrackets + link.length;
      editorRef.current.selectionStart = newCursorPos;
      editorRef.current.selectionEnd = newCursorPos;
      editorRef.current.focus();
    }

    setShowSuggester(false);
  }, []);

  const closeSuggester = useCallback(() => {
    setShowSuggester(false);
  }, []);

  return {
    showSuggester,
    suggesterPosition,
    linkQuery,
    handleInput,
    insertNoteLink,
    closeSuggester
  };
}

// Helper function to get caret coordinates
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const { offsetLeft: elementLeft, offsetTop: elementTop } = element;
  const div = document.createElement('div');
  const styles = getComputedStyle(element);
  
  div.style.position = 'absolute';
  div.style.top = '0';
  div.style.left = '0';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.font = styles.font;
  div.style.letterSpacing = styles.letterSpacing;
  div.style.lineHeight = styles.lineHeight;
  div.style.padding = styles.padding;
  div.style.border = styles.border;
  div.style.boxSizing = styles.boxSizing;
  
  const text = element.value.substring(0, position);
  const span = document.createElement('span');
  span.textContent = text;
  div.appendChild(span);
  
  document.body.appendChild(div);
  const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
  document.body.removeChild(div);
  
  return {
    left: elementLeft + spanLeft,
    top: elementTop + spanTop
  };
}
