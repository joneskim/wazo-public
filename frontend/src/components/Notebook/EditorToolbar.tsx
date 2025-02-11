import React from 'react';
import { Editor, Element as SlateElement, Node, Transforms } from 'slate';
import { useSlate } from 'slate-react';
import { 
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  CodeIcon,
  HeadingIcon,
  TextIcon,
  ListBulletIcon,
  TextAlignLeftIcon,
  FileTextIcon,
  MixIcon,
  ChevronDownIcon,
  TrashIcon,
  CheckIcon,
  DividerHorizontalIcon,
  Component1Icon
} from '@radix-ui/react-icons';
import { Button, Toolbar, ToolbarGroup } from './EditorComponents';
import { 
  CustomEditor, 
  CustomElement, 
  ElementType,
  BulletedListElement,
  NumberedListElement,
  ListItemElement
} from '../../types/slate';
import { TagEditorWrapper } from './TagEditorWrapper';

const LIST_TYPES = ['numbered-list', 'bulleted-list', 'checkbox-list'] as const;

interface EditorToolbarProps {
  editor: CustomEditor;
  insertCodeBlock: () => void;
  insertEquationBlock: (editor: CustomEditor) => void;
  insertInlineEquation?: (editor: CustomEditor) => void;
  tags?: string;
  onTagsChange?: (newTags: string) => void;
}

const isMarkActive = (editor: CustomEditor, format: string) => {
  const marks = Editor.marks(editor) as any;
  return marks ? marks[format as keyof any] === true : false;
};

const isBlockActive = (editor: CustomEditor, format: ElementType) => {
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

const toggleMark = (editor: CustomEditor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const toggleBlock = (editor: CustomEditor, format: ElementType) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format as typeof LIST_TYPES[number]);

  if (isList) {
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: (n: Node): n is CustomElement =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          LIST_TYPES.includes(n.type as typeof LIST_TYPES[number]),
      })
    );

    if (match) {
      Transforms.unwrapNodes(editor, {
        match: (n: Node): n is CustomElement =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          LIST_TYPES.includes(n.type as typeof LIST_TYPES[number]),
        split: true,
      });
    }
  }

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

const insertCheckbox = (editor: CustomEditor) => {
  const checkboxItem = {
    type: 'checkbox-item',
    checked: false,
    children: [{ type: 'paragraph', children: [{ text: '' }] }]
  } as ListItemElement;

  const checkboxList = {
    type: 'checkbox-list',
    children: [checkboxItem]
  } as CustomElement;

  Transforms.insertNodes(editor, checkboxList);
};

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  insertCodeBlock,
  insertEquationBlock,
  insertInlineEquation,
  tags = '[]',
  onTagsChange = () => {}
}) => {
  return (
    <Toolbar>
      <ToolbarGroup>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            toggleMark(editor, 'bold');
          }}
          active={isMarkActive(editor, 'bold')}
          title="Bold (⌘B)"
        >
          <FontBoldIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            toggleMark(editor, 'italic');
          }}
          active={isMarkActive(editor, 'italic')}
          title="Italic (⌘I)"
        >
          <FontItalicIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            toggleMark(editor, 'underline');
          }}
          active={isMarkActive(editor, 'underline')}
          title="Underline (⌘U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            toggleMark(editor, 'code');
          }}
          active={isMarkActive(editor, 'code')}
          title="Inline Code (⌘`)"
        >
          <CodeIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            if (insertInlineEquation) {
              insertInlineEquation(editor);
            }
          }}
          active={isBlockActive(editor, 'inline-equation')}
          title="Inline Equation ($)"
        >
          <Component1Icon className="w-4 h-4" />
        </Button>
      </ToolbarGroup>

      <ToolbarGroup>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            toggleBlock(editor, 'heading-one');
          }}
          active={isBlockActive(editor, 'heading-one')}
          title="Heading 1"
        >
          <HeadingIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            toggleBlock(editor, 'heading-two');
          }}
          active={isBlockActive(editor, 'heading-two')}
          title="Heading 2"
        >
          <TextIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            toggleBlock(editor, 'bulleted-list');
          }}
          active={isBlockActive(editor, 'bulleted-list')}
          title="Bulleted List"
        >
          <ListBulletIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            toggleBlock(editor, 'numbered-list');
          }}
          active={isBlockActive(editor, 'numbered-list')}
          title="Numbered List"
        >
          <TextAlignLeftIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            insertCheckbox(editor);
          }}
          title="Checkbox"
        >
          <CheckIcon className="w-4 h-4" />
        </Button>
      </ToolbarGroup>

      <ToolbarGroup>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            insertCodeBlock();
          }}
          title="Code Block (⌘⇧C)"
        >
          <FileTextIcon className="w-4 h-4" />
        </Button>
        <Button 
          onMouseDown={event => {
            event.preventDefault();
            insertEquationBlock(editor);
          }}
          title="Equation Block (⌘⇧E)"
        >
          <MixIcon className="w-4 h-4" />
        </Button>
      </ToolbarGroup>

      <ToolbarGroup>
        <div className="flex-grow">
          <TagEditorWrapper
            tagsString={tags}
            onTagsChange={onTagsChange}
          />
        </div>
      </ToolbarGroup>
    </Toolbar>
  );
};