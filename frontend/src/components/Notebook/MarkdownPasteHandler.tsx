import React from 'react';
import { Editor } from 'slate';
import { CustomElement, CodeBlockElement, HeadingElement } from '../../types/slate';

interface MarkdownPasteHandlerProps {
  editor: Editor;
  children: React.ReactNode;
}

export const MarkdownPasteHandler: React.FC<MarkdownPasteHandlerProps> = ({ editor, children }) => {
  const handlePaste = (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData('text/plain');
    
    // Check if it looks like React/JSX code
    const hasJSXSyntax = /[<>]/.test(text) && 
      (/className=/.test(text) || 
       /import.*from/.test(text) || 
       /export.*default/.test(text) ||
       /function.*\(/.test(text));

    // If it looks like code, insert as a code block
    if (hasJSXSyntax) {
      event.preventDefault();
      const codeBlock: CodeBlockElement = {
        type: 'code-block',
        language: 'jsx',
        code: text,
        children: [{ text: '' }],
      };
      editor.insertNode(codeBlock);
      return;
    }

    // Handle markdown-style headers
    const headerMatch = text.match(/^(#{1,6})\s/);
    if (headerMatch) {
      event.preventDefault();
      const level = headerMatch[1].length;
      
      // Map the markdown heading level to our supported heading types
      const headingType = level === 1 ? 'heading-one' 
                       : level === 2 ? 'heading-two'
                       : 'heading-three';  // levels 3-6 will be treated as heading-three
      
      const heading: HeadingElement = {
        type: headingType,
        children: [{ text: text.replace(/^#{1,6}\s/, '') }],
      };
      editor.insertNode(heading);
      return;
    }
  };

  return (
    <div onPaste={handlePaste}>
      {children}
    </div>
  );
};
