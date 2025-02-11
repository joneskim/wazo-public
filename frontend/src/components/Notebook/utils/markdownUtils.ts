import { Editor, Transforms, Element, Text, Range, Path, Node } from 'slate';
import { 
  CustomElement, 
  BulletedListElement, 
  CustomText, 
  ElementType, 
  ParagraphElement, 
  ListItemElement,
  HeadingElement,
  BlockquoteElement,
  CodeBlockElement,
  InlineEquationElement
} from '../../../types/slate';
import { toggleBlock } from '../notebookUtils';
import { Element as SlateElement } from 'slate';

interface BlockMarkdownConversion {
  pattern: RegExp;
  type: string;
  checked?: boolean;
}

interface InlineMarkdownConversion {
  pattern: RegExp;
  type?: string;
  format?: string;
}

const BLOCK_PATTERNS: BlockMarkdownConversion[] = [
  { pattern: /^#\s+(.*)$/, type: 'heading-one' },
  { pattern: /^##\s+(.*)$/, type: 'heading-two' },
  { pattern: /^###\s+(.*)$/, type: 'heading-three' },
  { pattern: /^[-*]\s+(.*)$/, type: 'bulleted-list' },
  { pattern: /^>\s*(.*)$/, type: 'blockquote' },
  { pattern: /^```\s*(.*)$/, type: 'code-block' },
  { pattern: /^\[ \]\s+(.*)$/, type: 'checkbox-list', checked: false },
  { pattern: /^\[x\]\s+(.*)$/, type: 'checkbox-list', checked: true },
];

const INLINE_PATTERNS: InlineMarkdownConversion[] = [
  { pattern: /\*\*([^*]+)\*\*/g, type: 'text', format: 'bold' },
  { pattern: /\*([^*]+)\*/g, type: 'text', format: 'italic' },
  { pattern: /`([^`]+)`/g, type: 'text', format: 'code' },
  { pattern: /\$([^$]+)\$/g, type: 'equation' },
];

const MARKDOWN_TRIGGERS: Record<string, ElementType> = {
  '#': 'heading-one',
  '##': 'heading-two',
  '###': 'heading-three',
  '-': 'bulleted-list',
  '[': 'checkbox-list',
  '>': 'blockquote',
  '`': 'code-block',
  '$': 'inline-equation',
} as const;

export const LIST_TYPES = ['numbered-list', 'bulleted-list', 'checkbox-list'];

function processInlineMarkdown(text: string): CustomText[] {
  let result: CustomText[] = [];
  let lastIndex = 0;
  let foundMatch = false;

  // Try each inline pattern
  for (const pattern of INLINE_PATTERNS) {
    const matches = Array.from(text.matchAll(pattern.pattern));
    if (matches.length > 0) {
      foundMatch = true;
      let currentIndex = 0;

      matches.forEach(match => {
        // Add text before the match
        if (match.index! > currentIndex) {
          result.push({ text: text.slice(currentIndex, match.index) });
        }

        // Add the formatted text
        if (pattern.format) {
          result.push({ 
            text: match[1],
            [pattern.format]: true 
          });
        } else if (pattern.type === 'equation') {
          result.push({ 
            text: '',
            equation: match[1]
          });
        }

        currentIndex = match.index! + match[0].length;
      });

      // Add remaining text
      if (currentIndex < text.length) {
        result.push({ text: text.slice(currentIndex) });
      }
    }
  }

  // If no patterns matched, return original text
  if (!foundMatch) {
    result = [{ text }];
  }

  return result;
}

export function handleMarkdownConversion(editor: Editor, event: React.KeyboardEvent) {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) {
    return false;
  }

  // Get the current block node
  const [block, path] = Editor.above(editor, {
    match: n => Element.isElement(n) && Editor.isBlock(editor, n),
  }) || [];

  if (!block || !path) {
    return false;
  }

  // Handle inline equation conversion
  if (event.key === '$') {
    // Look backward for opening $
    let start = selection.anchor;
    let found = false;
    let equationText = '';
    
    // Search backwards for the opening $
    while (start.offset > 0) {
      const before = { ...start, offset: start.offset - 1 };
      const range = { anchor: before, focus: start };
      const char = Editor.string(editor, range);
      
      if (char === '$') {
        found = true;
        // Get the equation text between the $ signs
        const equationRange = {
          anchor: { ...before, offset: before.offset + 1 },
          focus: selection.anchor
        };
        equationText = Editor.string(editor, equationRange);
        
        // Delete the equation text and both $ signs
        Transforms.delete(editor, {
          at: {
            anchor: before,
            focus: { ...selection.anchor, offset: selection.anchor.offset + 1 }
          }
        });
        
        // Insert the inline equation node
        Transforms.insertNodes(editor, {
          type: 'inline-equation',
          equation: equationText,
          children: [{ text: '' }]
        } as InlineEquationElement);
        
        return true;
      }
      
      start = before;
    }
  }

  // Get text before cursor for block conversions
  const start = Editor.start(editor, path);
  const range = { anchor: start, focus: selection.anchor };
  const text = Editor.string(editor, range);

  // Handle immediate conversion for markdown symbols
  if (event.key === ' ') {
    if (text === '#') {
      event.preventDefault();
      Editor.withoutNormalizing(editor, () => {
        Transforms.delete(editor, { at: range });
        Transforms.setNodes<CustomElement>(
          editor,
          { type: 'heading-one' },
          { match: n => Element.isElement(n) }
        );
      });
      return true;
    }

    if (text === '##') {
      event.preventDefault();
      Editor.withoutNormalizing(editor, () => {
        Transforms.delete(editor, { at: range });
        Transforms.setNodes<CustomElement>(
          editor,
          { type: 'heading-two' },
          { match: n => Element.isElement(n) }
        );
      });
      return true;
    }

    if (text === '###') {
      event.preventDefault();
      Editor.withoutNormalizing(editor, () => {
        Transforms.delete(editor, { at: range });
        Transforms.setNodes<CustomElement>(
          editor,
          { type: 'heading-three' },
          { match: n => Element.isElement(n) }
        );
      });
      return true;
    }

    if (text === '-') {
      event.preventDefault();
      Editor.withoutNormalizing(editor, () => {
        Transforms.delete(editor, { at: range });
        toggleBlock(editor, 'bulleted-list');
      });
      return true;
    }

    if (text === '[ ]' || text === '[x]') {
      event.preventDefault();
      Editor.withoutNormalizing(editor, () => {
        Transforms.delete(editor, { at: range });
        toggleBlock(editor, 'checkbox-list');
        
        // Set checkbox state after the list is created
        const [node] = Editor.nodes(editor, {
          match: n => Element.isElement(n) && n.type === 'checkbox-item',
        });
        
        if (node) {
          const [element, path] = node;
          Transforms.setNodes(
            editor,
            { checked: text === '[x]' },
            { at: path }
          );
        }
      });
      return true;
    }

    if (text === '>') {
      event.preventDefault();
      Editor.withoutNormalizing(editor, () => {
        Transforms.delete(editor, { at: range });
        Transforms.setNodes<CustomElement>(
          editor,
          { type: 'blockquote' },
          { match: n => Element.isElement(n) }
        );
      });
      return true;
    }

    if (text === '```') {
      event.preventDefault();
      Editor.withoutNormalizing(editor, () => {
        Transforms.delete(editor, { at: range });
        Transforms.setNodes<CustomElement>(
          editor,
          { type: 'code-block', language: 'javascript', code: '' },
          { match: n => Element.isElement(n) }
        );
      });
      return true;
    }
  }

  return false;
}
