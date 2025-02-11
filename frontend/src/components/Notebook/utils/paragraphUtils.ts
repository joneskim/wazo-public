import { CustomElement } from '../../../types/slate';

export function isEmptyParagraph(node: CustomElement): boolean {
  return (
    node.type === 'paragraph' &&
    node.children.length === 1 &&
    'text' in node.children[0] &&
    node.children[0].text === ''
  );
}
