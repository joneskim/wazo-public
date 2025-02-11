import { marked } from 'marked';
import TurndownService from 'turndown';
import { Text, Element as SlateElement } from 'slate';
import { CustomElement, CustomText } from '../types/slate';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

export const htmlToSlate = (html: string): CustomElement[] => {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const deserialize = (el: HTMLElement): any => {
    if (el.nodeType === 3) { // TEXT_NODE
      return { text: el.textContent || '' };
    } else if (el.nodeType !== 1) { // Not ELEMENT_NODE
      return null;
    }

    const children = Array.from(el.childNodes)
      .map((node) => deserialize(node as HTMLElement))
      .flat()
      .filter(Boolean);

    switch (el.nodeName.toLowerCase()) {
      case 'p':
        return { type: 'paragraph', children };
      case 'h1':
        return { type: 'heading-one', children };
      case 'h2':
        return { type: 'heading-two', children };
      case 'h3':
        return { type: 'heading-three', children };
      case 'blockquote':
        return { type: 'blockquote', children };
      case 'ul':
        return { type: 'bulleted-list', children };
      case 'ol':
        return { type: 'numbered-list', children };
      case 'li':
        return { type: 'list-item', children };
      case 'pre':
        return {
          type: 'code-block',
          language: 'plaintext',
          children: [{ text: el.textContent || '' }]
        };
      case 'code':
        return { 
          type: 'code-block',
          language: 'plaintext',
          children: [{ text: el.textContent || '' }]
        };
      case 'strong':
      case 'b':
        return children.map(child => ({ ...child, bold: true }));
      case 'em':
      case 'i':
        return children.map(child => ({ ...child, italic: true }));
      case 'u':
        return children.map(child => ({ ...child, underline: true }));
      default:
        return children;
    }
  };

  const result = deserialize(div);
  return result.children || [];
};

export const markdownToSlate = async (markdown: string): Promise<CustomElement[]> => {
  try {
    const html = await marked(markdown);
    return htmlToSlate(html);
  } catch (error) {
    console.error('Error converting markdown to slate:', error);
    return [{ type: 'paragraph', children: [{ text: markdown }] }];
  }
};

export const slateToMarkdown = (nodes: CustomElement[]): string => {
  const serialize = (node: CustomElement | CustomText): string => {
    if (Text.isText(node)) {
      let text = node.text;
      if (node.bold) text = `**${text}**`;
      if (node.italic) text = `*${text}*`;
      if (node.code) text = `\`${text}\``;
      return text;
    }

    const children = node.children.map(serialize).join('');

    switch (node.type) {
      case 'paragraph':
        return `${children}\n\n`;
      case 'heading-one':
        return `# ${children}\n\n`;
      case 'heading-two':
        return `## ${children}\n\n`;
      case 'heading-three':
        return `### ${children}\n\n`;
      case 'blockquote':
        return `> ${children}\n\n`;
      case 'code-block':
        return `\`\`\`${node.language || ''}\n${children}\n\`\`\`\n\n`;
      case 'bulleted-list':
        return children;
      case 'numbered-list':
        return children;
      case 'list-item':
        return `- ${children}\n`;
      default:
        return children;
    }
  };

  return nodes.map(serialize).join('');
};

export const handlePaste = (event: ClipboardEvent): CustomElement[] | null => {
  const html = event.clipboardData?.getData('text/html');
  if (html) {
    return htmlToSlate(html);
  }
  return null;
};

export const handlePasteMarkdown = async (text: string): Promise<CustomElement[]> => {
  try {
    const nodes = await markdownToSlate(text);
    return nodes;
  } catch (error) {
    console.error('Error handling markdown paste:', error);
    return [{ type: 'paragraph', children: [{ text }] }];
  }
};
