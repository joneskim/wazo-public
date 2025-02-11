import React from 'react';
import { RenderElementProps } from 'slate-react';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms } from 'slate';
import { CodeBlockWrapper } from '../CodeBlock/CodeBlockWrapper';
import { InlineEquation } from './InlineEquation';
import { CustomElement, CodeBlockElement, EquationElement, ListItemElement } from '../../types/slate';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import CheckboxElement from './CheckboxElement';
import { EquationBlock } from '../EquationBlock/EquationBlock';

const ElementRenderer = (props: RenderElementProps): JSX.Element => {
  const { element, ...restProps } = props;
  const editor = useSlate();

  const styles = {
    checkboxList: {
      listStyle: 'none',
      padding: 0,
      margin: '0.5em 0',
    },
    checkboxItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5em',
      margin: '0.25em 0',
      cursor: 'pointer',
    },
    checkbox: {
      width: '1.2em',
      height: '1.2em',
      cursor: 'pointer',
      margin: '0.2em',
      accentColor: 'currentColor',
    },
    checkboxWrapper: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.2em',
      borderRadius: '0.2em',
      cursor: 'pointer',
      userSelect: 'none' as const,
    }
  };

  switch (element.type) {
    case 'checkbox-item':
      return <CheckboxElement {...restProps} element={element as ListItemElement} />;
    case 'paragraph':
      return <p {...restProps.attributes}>{restProps.children}</p>;
    case 'code-block':
      return (
        <CodeBlockWrapper
          {...restProps}
          element={element as CodeBlockElement}
        />
      );
    case 'equation':
      return (
        <EquationBlock
          {...restProps}
          element={element as EquationElement}
          editor={editor}
        />
      );
    case 'heading-one':
      return (
        <h1 {...restProps.attributes} className="text-3xl font-bold mt-8 mb-4">
          {restProps.children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 {...restProps.attributes} className="text-2xl font-bold mt-6 mb-3">
          {restProps.children}
        </h2>
      );
    case 'heading-three':
      return (
        <h3 {...restProps.attributes} className="text-xl font-bold mt-5 mb-2">
          {restProps.children}
        </h3>
      );
    case 'checkbox-list':
      return <ul {...restProps.attributes} className="space-y-1 list-none">{restProps.children}</ul>;
    case 'blockquote':
      return (
        <blockquote {...restProps.attributes} className="border-l-4 border-gray-300 pl-4 my-4 italic">
          {restProps.children}
        </blockquote>
      );
    case 'numbered-list':
      return (
        <ol {...restProps.attributes} className="list-decimal list-inside my-4">
          {restProps.children}
        </ol>
      );
    case 'bulleted-list':
      return (
        <ul {...restProps.attributes} className="list-disc list-inside my-4">
          {restProps.children}
        </ul>
      );
    case 'list-item':
      return (
        <li {...restProps.attributes} className="my-1">
          {restProps.children}
        </li>
      );
    case 'inline-equation':
      return <InlineEquation {...restProps} element={element as any} />;
    default:
      return <p {...restProps.attributes}>{restProps.children}</p>;
  }
};

export default ElementRenderer;
