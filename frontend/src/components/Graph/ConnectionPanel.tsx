import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GraphNode } from './graphUtils';
import { getNoteTitle, getNotePreview } from '../../utils/noteUtils';
import { parseJsonArray } from '../../utils/jsonUtils';

interface ConnectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (targetId: string) => void;
  sourceNode: GraphNode | null;
  availableNodes: GraphNode[];
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  isOpen,
  onClose,
  onConnect,
  sourceNode,
  availableNodes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when panel opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Get source node tags and references
  const { sourceTags, sourceRefs } = useMemo(() => {
    if (!sourceNode) return { sourceTags: [], sourceRefs: [] };
    return {
      sourceTags: parseJsonArray(sourceNode.data.tags),
      sourceRefs: parseJsonArray(sourceNode.data.references)
    };
  }, [sourceNode]);

  // Filter and sort nodes based on search and tags
  const filteredNodes = useMemo(() => {
    if (!sourceNode) return [];

    return availableNodes
      .filter(node => {
        if (node.id === sourceNode.id) return false;
        
        const title = getNoteTitle(node.data.content).toLowerCase();
        const preview = getNotePreview(node.data.content).toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return title.includes(query) || preview.includes(query);
      })
      .sort((a, b) => {
        const aTags = parseJsonArray(a.data.tags);
        const bTags = parseJsonArray(b.data.tags);
        
        // Count matching tags
        const aMatches = aTags.filter(tag => sourceTags.includes(tag)).length;
        const bMatches = bTags.filter(tag => sourceTags.includes(tag)).length;
        
        // Sort by connection status first, then matching tags, then title
        const aConnected = sourceRefs.includes(a.id);
        const bConnected = sourceRefs.includes(b.id);
        
        if (aConnected !== bConnected) {
          return aConnected ? -1 : 1;
        }
        
        if (aMatches !== bMatches) {
          return bMatches - aMatches;
        }
        
        return getNoteTitle(a.data.content).localeCompare(getNoteTitle(b.data.content));
      });
  }, [sourceNode, availableNodes, searchQuery, sourceTags, sourceRefs]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredNodes[selectedIndex]) {
          onConnect(filteredNodes[selectedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Connect to Note
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mt-4">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            autoFocus
          />
        </div>
      </div>

      {/* Results list */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        {filteredNodes.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNodes.map((node, index) => {
              const title = getNoteTitle(node.data.content);
              const preview = getNotePreview(node.data.content);
              const tags = parseJsonArray(node.data.tags);
              const matchingTags = tags.filter(tag => sourceTags.includes(tag));
              const isConnected = sourceRefs.includes(node.id);

              return (
                <li
                  key={node.id}
                  onClick={() => onConnect(node.id)}
                  className={`cursor-pointer p-4 transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {title}
                    </div>
                    {isConnected && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        Connected
                      </span>
                    )}
                  </div>
                  {matchingTags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {matchingTags.map(tag => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {preview}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No matching notes found
          </div>
        )}
      </div>
    </div>
  );
};
