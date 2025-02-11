import { Descendant, Editor, Element as SlateElement, Range, Transforms, Text, Node, Path, createEditor, NodeMatch } from 'slate';
import { ReactEditor } from 'slate-react';
import { CustomElement, CustomEditor, ElementType, CodeBlockElement, BulletedListElement, NumberedListElement, HeadingElement, EquationElement } from '../../types/slate';
import isHotkey from 'is-hotkey';
import { Note } from '../../types';

export interface NotebookProps {
  note: Note;
  onUpdate: (note: Partial<Note>) => void;
  onDelete?: () => void;
  onCreate?: (note: Note) => void;
}

export const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
  'mod+e': 'equation'
};

export const LIST_TYPES = ['numbered-list', 'bulleted-list', 'checkbox-list'];

export const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

export const parseNoteContent = (content: string | null): Descendant[] => {
  if (!content) return initialValue;
  
  try {
    // Handle multiple levels of JSON stringification
    let parsedContent = content;
    while (typeof parsedContent === 'string') {
      try {
        parsedContent = JSON.parse(parsedContent);
      } catch {
        break;
      }
    }
    
    // Ensure the content is an array of valid Slate nodes
    if (Array.isArray(parsedContent)) {
      return parsedContent as Descendant[];
    }
    
    console.warn('Note content is not an array, creating default structure');
    return initialValue;
  } catch (error) {
    console.error('Error parsing note content:', error);
    return initialValue;
  }
};


export const parseJsonArray = (jsonString: string | null): any[] => {
  try {
    return JSON.parse(jsonString || '[]');
  } catch (error) {
    // console.error('Error parsing JSON array:', error);
    return [];
  }
};

export const serializeToMarkdown = (nodes: Descendant[], editor: Editor): string => {
  return nodes.map(node => {
    if (Text.isText(node)) {
      let text = node.text;
      if (node.bold) {
        text = `**${text}**`;
      }
      if (node.italic) {
        text = `*${text}*`;
      }
      if (node.code) {
        text = `\`${text}\``;
      }
      if (node.underline) {
        text = `__${text}__`;
      }
      if (node.equation) {
        text = `$${text}$`;
      }
      return text;
    }

    const element = node as CustomElement;
    const children = element.children.map(n => serializeToMarkdown([n], editor)).join('');

    switch (element.type) {
      case 'paragraph':
        return `${children}\n\n`;
      case 'heading-one':
        return `# ${children}\n\n`;
      case 'heading-two':
        return `## ${children}\n\n`;
      case 'heading-three':
        return `### ${children}\n\n`;
      case 'bulleted-list':
        return children;
      case 'numbered-list':
        return children;
      case 'list-item':
        const parent = Editor.parent(editor, ReactEditor.findPath(editor, element))[0] as CustomElement;
        const prefix = parent.type === 'numbered-list' ? '1. ' : '- ';
        return `${prefix}${children}\n`;
      case 'blockquote':
        return `> ${children}\n\n`;
      case 'code-block':
        return `\`\`\`\n${children}\`\`\`\n\n`;
      case 'thematic-break':
        return `---\n\n`;
      case 'equation':
        return `$$\n${children}\n$$\n\n`;
      case 'toc-section':
        return `# Table of Contents\n\n${children}\n\n`;
      case 'toc-item':
        return `- ${children}\n`;
      default:
        return children;
    }
  }).join('');
};


export const isMarkActive = (editor: CustomEditor, format: string) => {
  const marks = Editor.marks(editor) as any;
  return marks ? marks[format as keyof any] === true : false;
};

export const toggleMark = (editor: CustomEditor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};


export const isBlockActive = (editor: CustomEditor, format: ElementType) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n: Node): n is CustomElement => 
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  );

  return !!match;
};

export const toggleBlock = (editor: CustomEditor, format: ElementType) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n: Node): n is CustomElement => 
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type as ElementType),
    split: true,
  });

  const newProperties: Partial<CustomElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  };
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = {
      type: format,
      children: []
    } as BulletedListElement | NumberedListElement;
    Transforms.wrapNodes(editor, block);
  }
};

export const isCodeBlockActive = (editor: CustomEditor) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n: Node): n is CustomElement => 
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'code-block',
    })
  );

  return !!match;
};



export const toggleCodeBlock = (editor: CustomEditor) => {
  const isActive = isCodeBlockActive(editor);
  Transforms.setNodes(
    editor,
    { 
      type: isActive ? 'paragraph' : 'code-block',
      language: 'python',
      ...(isActive ? {} : { output: undefined, error: undefined })
    },
    { match: (n: Node): n is CustomElement => SlateElement.isElement(n) }
  );
};


export function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export const insertEquationBlock = (editor: CustomEditor) => {
  const equationBlock: EquationElement = {
    type: 'equation',
    equation: '',
    children: [{ text: '' }],
  };
  Transforms.insertNodes(editor, equationBlock);
};

export interface HeadingData {
  text: string;
  path: number[];
  depth: number;
}

export const updateTableOfContents = (editor: Editor, setTableOfContents: (headings: HeadingData[]) => void) => {
  if (!editor) return;

  const nodes = Array.from(
    Editor.nodes(editor, {
      at: [],
      match: (n: Node) =>
        SlateElement.isElement(n) &&
        ['heading-one', 'heading-two', 'heading-three'].includes(n.type),
    })
  );

  const headings: HeadingData[] = nodes.map(([node, path]) => {
    const element = node as CustomElement;
    const depth =
      element.type === 'heading-one'
        ? 1
        : element.type === 'heading-two'
        ? 2
        : 3;
    return {
      text: Node.string(node),
      path: path,
      depth,
    };
  });

  setTableOfContents(headings);
};

export const convertMarkdownToRichText = (text: string): CustomElement[] => {
  const nodes: CustomElement[] = [];
  
  // Handle block-level markdown first
  if (text.startsWith('# ')) {
    return [{
      type: 'heading-one',
      children: [{ text: text.slice(2) }]
    }];
  } else if (text.startsWith('## ')) {
    return [{
      type: 'heading-two',
      children: [{ text: text.slice(3) }]
    }];
  } else if (text.startsWith('### ')) {
    return [{
      type: 'heading-three',
      children: [{ text: text.slice(4) }]
    }];
  } else if (text.startsWith('> ')) {
    return [{
      type: 'blockquote',
      children: [{ text: text.slice(2) }]
    }];
  } else if (text.startsWith('```')) {
    const code = text.slice(3, -3).trim();
    return [{
      type: 'code-block',
      code,
      children: [{ text: code }]
    }];
  } else if (text === '---') {
    return [{
      type: 'thematic-break',
      children: [{ text: '' }]
    }];
  }

  // Handle inline markdown
  let remainingText = text;
  const inlineNodes: any[] = [];
  
  // Process text for inline markdown patterns
  while (remainingText.length > 0) {
    // Bold
    if (remainingText.startsWith('**') && remainingText.slice(2).includes('**')) {
      const endIndex = remainingText.slice(2).indexOf('**');
      const boldText = remainingText.slice(2, endIndex + 2);
      inlineNodes.push({ text: boldText, bold: true });
      remainingText = remainingText.slice(endIndex + 4);
    }
    // Italic
    else if (remainingText.startsWith('*') && remainingText.slice(1).includes('*')) {
      const endIndex = remainingText.slice(1).indexOf('*');
      const italicText = remainingText.slice(1, endIndex + 1);
      inlineNodes.push({ text: italicText, italic: true });
      remainingText = remainingText.slice(endIndex + 2);
    }
    // Inline code
    else if (remainingText.startsWith('`') && remainingText.slice(1).includes('`')) {
      const endIndex = remainingText.slice(1).indexOf('`');
      const codeText = remainingText.slice(1, endIndex + 1);
      inlineNodes.push({ text: codeText, code: true });
      remainingText = remainingText.slice(endIndex + 2);
    }
    // Underline
    else if (remainingText.startsWith('__') && remainingText.slice(2).includes('__')) {
      const endIndex = remainingText.slice(2).indexOf('__');
      const underlineText = remainingText.slice(2, endIndex + 2);
      inlineNodes.push({ text: underlineText, underline: true });
      remainingText = remainingText.slice(endIndex + 4);
    }
    // Plain text until next markdown syntax
    else {
      const nextMarkdown = remainingText.match(/(\*\*|__|`|\*)/);
      if (nextMarkdown && nextMarkdown.index !== undefined) {
        const plainText = remainingText.slice(0, nextMarkdown.index);
        if (plainText) {
          inlineNodes.push({ text: plainText });
        }
        remainingText = remainingText.slice(nextMarkdown.index);
      } else {
        // No more markdown syntax, add remaining text
        inlineNodes.push({ text: remainingText });
        remainingText = '';
      }
    }
  }

  // If we processed any inline formatting, wrap in paragraph
  if (inlineNodes.length > 0) {
    return [{
      type: 'paragraph',
      children: inlineNodes
    }];
  }

  // Default to paragraph with plain text
  return [{
    type: 'paragraph',
    children: [{ text }]
  }];
};

export const handleEnterInList = (editor: CustomEditor): boolean => {
  const { selection } = editor;
  if (!selection) return false;

  const [block, path] = Editor.above(editor, {
    match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
  }) || [];

  if (!block || !path) return false;

  const customBlock = block as CustomElement;

  // For lists and checkboxes
  if (customBlock.type === 'list-item' || customBlock.type === 'checkbox-item') {
    const text = Editor.string(editor, path);
    
    // If empty, convert to paragraph
    if (text.trim() === '') {
      // Get the parent list type (bulleted-list or checkbox-list)
      const [parentNode] = Editor.parent(editor, path);
      const listType = SlateElement.isElement(parentNode) ? (parentNode as CustomElement).type : null;
      
      // Convert to paragraph using toggleBlock
      if (listType && LIST_TYPES.includes(listType)) {
        toggleBlock(editor, listType);
      }
      return true;
    }
    
    // Create a new list item
    Transforms.splitNodes(editor);
    const [parentNode] = Editor.parent(editor, path);
    
    // Set checked: false for new checkbox items
    if (SlateElement.isElement(parentNode) && (parentNode as CustomElement).type === 'checkbox-list') {
      const newPath = Path.next(path);
      Transforms.setNodes(
        editor,
        { checked: false },
        { at: newPath }
      );
    }
  }

  return false;
};

export const handleEnterInHeading = (editor: CustomEditor): boolean => {
  const { selection } = editor;
  if (!selection) return false;

  const [block, path] = Editor.above(editor, {
    match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
  }) || [];

  if (!block || !path) return false;

  const customBlock = block as CustomElement;

  if (customBlock.type === 'heading-one' || customBlock.type === 'heading-two' || customBlock.type === 'heading-three') {
    // Insert a new paragraph after the heading
    const nextPath = Path.next(path);
    Transforms.insertNodes(
      editor,
      { type: 'paragraph', children: [{ text: '' }] },
      { at: nextPath }
    );
    Transforms.select(editor, nextPath);
    return true;
  }

  return false;
};

export function handleExportMarkdown(editor: CustomEditor, note: Note) {
  const markdown = serializeToMarkdown(editor.children, editor);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title || 'note'}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};