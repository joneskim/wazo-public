import { BaseEditor, BaseElement, BaseText } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

export type ElementType =
  | 'paragraph'
  | 'code-block'
  | 'bulleted-list'
  | 'numbered-list'
  | 'list-item'
  | 'checkbox-list'
  | 'checkbox-item'
  | 'heading-one'
  | 'heading-two'
  | 'heading-three'
  | 'link'
  | 'image'
  | 'blockquote'
  | 'thematic-break'
  | 'equation'
  | 'inline-equation'
  | 'toc-section'
  | 'toc-item';

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

export interface CodeBlockElement extends BaseElement {
  type: 'code-block';
  language?: string;
  code: string;
  output?: string;
  error?: string;
  id?: string;
  children: CustomText[];
}

export interface ParagraphElement extends BaseElement {
  type: 'paragraph';
  children: Array<CustomElement | CustomText>;
}

export interface HeadingElement extends BaseElement {
  type: 'heading-one' | 'heading-two' | 'heading-three';
  children: CustomText[];
}

export interface ListItemElement extends BaseElement {
  type: 'list-item' | 'checkbox-item';
  checked?: boolean;
  children: CustomElement[];
}

export interface BulletedListElement extends BaseElement {
  type: 'bulleted-list' | 'checkbox-list';
  children: ListItemElement[];
}

export interface NumberedListElement extends BaseElement {
  type: 'numbered-list';
  children: ListItemElement[];
}

export interface LinkElement extends BaseElement {
  type: 'link';
  url: string;
  children: CustomText[];
}

export interface ImageElement extends BaseElement {
  type: 'image';
  url: string;
  children: CustomText[];
}

export interface BlockquoteElement extends BaseElement {
  type: 'blockquote';
  children: CustomText[];
}

export interface ThematicBreakElement extends BaseElement {
  type: 'thematic-break';
  children: CustomText[];
}

export interface EquationElement extends BaseElement {
  type: 'equation';
  equation: string;
  children: CustomText[];
}

export interface InlineEquationElement extends BaseElement {
  type: 'inline-equation';
  equation: string;
  children: CustomText[];
}

export interface TocItemElement extends BaseElement {
  type: 'toc-item';
  level: number;
  children: CustomText[];
}

export interface TocSectionElement extends BaseElement {
  type: 'toc-section';
  children: TocItemElement[];
}

export interface CustomText extends BaseText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  equation?: string;
}

export type CustomElement =
  | ParagraphElement
  | CodeBlockElement
  | HeadingElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement
  | LinkElement
  | ImageElement
  | BlockquoteElement
  | ThematicBreakElement
  | EquationElement
  | InlineEquationElement
  | TocSectionElement
  | TocItemElement;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
