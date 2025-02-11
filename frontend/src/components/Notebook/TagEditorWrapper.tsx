import React from 'react';
import { TagEditor } from '../TagEditor/TagEditor';

interface TagEditorWrapperProps {
  tagsString: string;
  onTagsChange: (newTags: string) => void;
}

const parseJsonArray = (jsonString: string): string[] => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    // console.error('Error parsing JSON array:', error);
    return [];
  }
};

const stringifyArray = (array: any[]): string => {
  try {
    return JSON.stringify(array);
  } catch (error) {
    console.error('Error stringifying JSON array:', error);
    return '[]';
  }
};

export const TagEditorWrapper: React.FC<TagEditorWrapperProps> = ({
  tagsString,
  onTagsChange
}) => {
  return (
    <TagEditor
      tags={parseJsonArray(tagsString)}
      onTagsChange={(newTags) => {
        onTagsChange(stringifyArray(newTags));
      }}
    />
  );
};