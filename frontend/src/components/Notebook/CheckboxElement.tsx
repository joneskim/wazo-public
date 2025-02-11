import React from 'react';
import { RenderElementProps, useSlateStatic, ReactEditor } from 'slate-react';
import { Transforms } from 'slate';
import { CustomElement, ListItemElement } from '../../types/slate';

const CheckboxElement: React.FC<RenderElementProps & { element: ListItemElement }> = ({ 
  attributes, 
  children, 
  element 
}) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const checked = element.checked || false;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    Transforms.setNodes(
      editor,
      { checked: newChecked },
      { at: path }
    );
  };

  return (
    <div {...attributes} className="flex items-start py-1 group">
      <div 
        className="relative flex items-start"
        contentEditable={false}
        style={{ userSelect: 'none' }}
      >
        <div className="flex h-6 items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 
                     cursor-pointer transition-colors duration-200 
                     hover:border-blue-500"
          />
        </div>
      </div>
      <div className="ml-3 flex-grow">
        <span className={`text-gray-700 ${checked ? 'line-through text-gray-500' : ''}`}>
          {children}
        </span>
      </div>
    </div>
  );
};

export default CheckboxElement;