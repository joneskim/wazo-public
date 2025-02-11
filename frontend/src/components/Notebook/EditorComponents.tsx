import React from 'react';
import { RenderElementProps, RenderLeafProps } from 'slate-react';
import { Editor, Element as SlateElement, Transforms, Node } from 'slate';
import { CustomElement, CodeBlockElement, CustomEditor, ElementType, EquationElement } from '../../types/slate';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import { EquationBlock } from '../EquationBlock/EquationBlock';

import {
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  CodeIcon,
  HeadingIcon,
  TextIcon,
  ListBulletIcon,
  TextAlignLeftIcon,
  Link2Icon,
  ImageIcon,
  TrashIcon,
  MixIcon
} from '@radix-ui/react-icons';

import katex from 'katex';
import 'katex/dist/katex.min.css';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
>(({ className = '', active, ...props }, ref) => (
  <button
    {...props}
    ref={ref}
    className={`
      p-2 rounded-lg text-gray-700 dark:text-gray-300
      hover:bg-gray-100 dark:hover:bg-gray-700
      focus:outline-none focus:ring-2 focus:ring-blue-500
      transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      ${active ? 'bg-gray-200 dark:bg-gray-600' : ''}
      ${className}
    `}
  />
));

Button.displayName = 'Button';

export const Toolbar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div
    {...props}
    className={`
      flex flex-wrap gap-2 p-2 bg-white dark:bg-gray-800 
      border-b border-gray-200 dark:border-gray-700 
      sticky top-0 z-10 ${className}
    `}
  />
);

export const ToolbarGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div
    {...props}
    className={`
      flex items-center gap-1 
      border-r border-gray-200 dark:border-gray-700 
      pr-2 last:border-r-0 ${className}
    `}
  />
);

interface ElementProps extends RenderElementProps {
  element: CustomElement;
  editor: CustomEditor;
}

export const Element = (props: ElementProps) => {
  const { element } = props;

  switch (element.type) {
    case 'code-block':
      return <CodeBlock {...props} element={element as CodeBlockElement} />;
    case 'equation':
      return <EquationBlock {...props} element={element as EquationElement} />;
    case 'paragraph':
      return <p {...props.attributes}>{props.children}</p>;
    case 'heading-one':
      return <h1 {...props.attributes}>{props.children}</h1>;
    case 'heading-two':
      return <h2 {...props.attributes}>{props.children}</h2>;
    case 'heading-three':
      return <h3 {...props.attributes}>{props.children}</h3>;
    case 'bulleted-list':
      return <ul {...props.attributes}>{props.children}</ul>;
    case 'numbered-list':
      return <ol {...props.attributes}>{props.children}</ol>;
    case 'list-item':
      return <li {...props.attributes}>{props.children}</li>;
    case 'link':
      return <a {...props.attributes} href={element.url}>{props.children}</a>;
    case 'image':
      return <img {...props.attributes} src={element.url} alt="" />;
    case 'blockquote':
      return <blockquote {...props.attributes}>{props.children}</blockquote>;
    case 'thematic-break':
      return <hr {...props.attributes} />;
    default:
      return <p {...props.attributes}>{props.children}</p>;
  }
};

export const renderLeaf = (props: RenderLeafProps) => {
  let { children } = props;
  if (props.leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (props.leaf.italic) {
    children = <em>{children}</em>;
  }
  if (props.leaf.underline) {
    children = <u>{children}</u>;
  }
  if (props.leaf.code) {
    children = <code>{children}</code>;
  }
  if (props.leaf.equation) {
    try {
      const html = katex.renderToString(props.leaf.equation, {
        throwOnError: false,
        displayMode: false,
        output: 'html',
      });
      children = <span className="px-1" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (error) {
      console.error('Error rendering equation:', error);
      children = <code>{props.leaf.equation}</code>;
    }
  }
  return <span {...props.attributes}>{children}</span>;
};

export const isCodeBlockActive = (editor: Editor) => {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n: Node): n is CustomElement => 
        SlateElement.isElement(n) && n.type === 'code-block',
    })
  );

  return !!match;
};

export const toggleCodeBlock = (editor: Editor) => {
  const isActive = isCodeBlockActive(editor);

  Transforms.setNodes(
    editor,
    { type: isActive ? 'paragraph' : 'code-block', code: '' },
    { match: (n: Node): n is CustomElement => SlateElement.isElement(n) }
  );
};

export const HeadingBlock = ({ level, attributes, children }: { level: number; attributes: any; children: React.ReactNode }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizes = {
    1: 'text-2xl font-semibold mb-4',
    2: 'text-xl font-medium mb-3',
    3: 'text-lg font-medium mb-2'
  };

  return (
    <Tag
      {...attributes}
      className={`${sizes[level as keyof typeof sizes]} text-gray-900 dark:text-white`}
    >
      {children}
    </Tag>
  );
};

// Map format to icon component
export const formatIcons = {
  bold: <FontBoldIcon className="w-4 h-4" />,
  italic: <FontItalicIcon className="w-4 h-4" />,
  underline: <UnderlineIcon className="w-4 h-4" />,
  code: <CodeIcon className="w-4 h-4" />,
  'heading-one': <HeadingIcon className="w-4 h-4" />,
  'heading-two': <TextIcon className="w-4 h-4" />,
  'bulleted-list': <ListBulletIcon className="w-4 h-4" />,
  'numbered-list': <TextAlignLeftIcon className="w-4 h-4" />,
  'equation': <MixIcon className="w-4 h-4" />,
  link: <Link2Icon className="w-4 h-4" />,
  image: <ImageIcon className="w-4 h-4" />,
  delete: <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />,
};
