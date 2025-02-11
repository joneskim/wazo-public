import React from 'react';
import { RenderLeafProps } from 'slate-react';
import katex from 'katex';

const LeafRenderer = (props: RenderLeafProps): JSX.Element => {
  const { attributes, children, leaf } = props;
  let styledChildren = children;

  if (leaf.bold) {
    styledChildren = <strong>{styledChildren}</strong>;
  }

  if (leaf.italic) {
    styledChildren = <em>{styledChildren}</em>;
  }

  if (leaf.underline) {
    styledChildren = <u>{styledChildren}</u>;
  }

  if (leaf.code) {
    styledChildren = (
      <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 font-mono text-sm">
        {styledChildren}
      </code>
    );
  }

  if (leaf.equation) {
    try {
      const html = katex.renderToString(leaf.text, {
        throwOnError: false,
        output: 'html',
        displayMode: false,
      });
      
      return (
        <span {...attributes} dangerouslySetInnerHTML={{ __html: html }} />
      );
    } catch (error) {
      console.error('KaTeX error:', error);
      return <span {...attributes}>{children}</span>;
    }
  }

  return <span {...attributes}>{styledChildren}</span>;
};

export default LeafRenderer;
