import { Editor, Transforms } from 'slate';
import { EquationElement, InlineEquationElement } from '../../../types/slate';

export const insertEquationBlock = (editor: Editor) => {
  const equationBlock: EquationElement = {
    type: 'equation',
    equation: '',
    children: [{ text: '' }]
  };
  Transforms.insertNodes(editor, equationBlock);
};

export const insertInlineEquation = (editor: Editor, equation: string = '') => {
  const inlineEquation: InlineEquationElement = {
    type: 'inline-equation',
    equation,
    children: [{ text: '' }]
  };
  Transforms.insertNodes(editor, inlineEquation);
};
