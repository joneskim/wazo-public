import React from 'react';
import { RenderElementProps, useSlate } from 'slate-react';
import { CodeBlockElement, CustomEditor } from '../../types/slate';
import { CodeBlock } from './CodeBlock';

interface CodeBlockWrapperProps extends RenderElementProps {
  element: CodeBlockElement;
  onLanguageChange?: (language: string) => void;
}

export const CodeBlockWrapper: React.FC<CodeBlockWrapperProps> = ({
  attributes,
  children,
  element,
  onLanguageChange,
}) => {
  const editor = useSlate() as CustomEditor;

  return (
    <CodeBlock
      attributes={attributes}
      element={element}
      onLanguageChange={onLanguageChange}
      editor={editor}
    >
      {children}
    </CodeBlock>
  );
};
