import React, { useState, useEffect, useMemo } from 'react';
import { Editor, Path, Node } from 'slate';
import { ReactEditor } from 'slate-react';
import { HiSearch, HiPlus, HiDotsHorizontal } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

interface TableOfContentsProps {
  items: Array<{
    text: string;
    path: number[];
    depth: number;
  }>;
  editor: Editor;
  onItemClick: (path: number[]) => void;
}

interface BreadcrumbItem {
  text: string;
  path: number[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ items, editor, onItemClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<number[] | null>(null);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Update breadcrumbs based on current selection
  useEffect(() => {
    if (!editor.selection) return;

    const currentPath = editor.selection.anchor.path;
    const newBreadcrumbs: BreadcrumbItem[] = [];
    
    items.forEach(item => {
      if (item.path && currentPath && Path.isAncestor(item.path, currentPath)) {
        newBreadcrumbs.push({ text: item.text, path: item.path });
      }
    });

    setBreadcrumbs(newBreadcrumbs);
  }, [editor.selection, items]);

  const handleAddSubheading = (path: number[], e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement add subheading functionality
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-900">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-900">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search headings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg
                     border border-gray-200 dark:border-gray-800 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-900">
        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-gray-400 dark:text-gray-500">/</span>
              )}
              <button
                onClick={() => onItemClick(crumb.path)}
                className="hover:text-blue-500 dark:hover:text-blue-400 truncate max-w-[150px]"
              >
                {crumb.text}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* TOC Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {filteredItems.map((item, index) => {
            const textNodePath = item.path ? [...item.path, 0] : null;
            const isActive = Boolean(editor.selection && textNodePath && Path.equals(
              textNodePath.slice(0, textNodePath.length - 1),
              editor.selection.anchor.path.slice(0, textNodePath.length - 1)
            ));

            return (
              <div
                key={index}
                className={`
                  group relative cursor-pointer
                  ml-${(item.depth - 1) * 4}
                  ${item.depth === 1 
                    ? 'mb-3 pb-2 border-b border-gray-200/80 dark:border-gray-700/80' 
                    : 'mb-1'
                  }
                `}
                onClick={() => {
                  if (!item.path) return;
                  onItemClick(item.path);
                }}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={`
                  flex items-center justify-between rounded-lg px-3 py-1.5
                  transition-all duration-200 ease-in-out
                  ${isActive 
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800' 
                    : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/30 hover:ring-1 hover:ring-gray-200 dark:hover:ring-gray-700'
                  }
                `}>
                  <div className="flex items-center flex-1" onClick={() => onItemClick(item.path)}>
                    {item.depth > 1 && (
                      <div className="flex items-center mr-2">
                        {Array(item.depth - 1).fill(0).map((_, i) => (
                          <div 
                            key={i}
                            className={`
                              w-1 h-1 rounded-full mx-0.5
                              ${isActive 
                                ? 'bg-blue-400 dark:bg-blue-500' 
                                : 'bg-gray-400 dark:bg-gray-500'
                              }
                            `}
                          />
                        ))}
                      </div>
                    )}
                    <span className={`
                      transition-colors duration-200 truncate
                      ${item.depth === 1 
                        ? 'text-base font-semibold text-gray-900 dark:text-gray-100' 
                        : item.depth === 2
                          ? 'text-sm font-medium text-gray-800 dark:text-gray-200'
                          : 'text-sm text-gray-700 dark:text-gray-300'
                      }
                    `}>
                      {item.text}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleAddSubheading(item.path, e)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <HiPlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                      <HiDotsHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Preview Tooltip */}
                <AnimatePresence>
                  {hoveredItem && Path.equals(hoveredItem, item.path) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="fixed z-50 w-64 p-3 rounded-lg shadow-lg
                               bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      style={{
                        left: '100%',
                        top: '0',
                        marginLeft: '0.5rem',
                        transform: 'translateY(-25%)'
                      }}
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {(() => {
                          try {
                            if (!item.path) return 'No preview available';
                            const [node] = Editor.node(editor, item.path);
                            const nextNodes = Editor.next(editor, { at: item.path });
                            let previewText = Node.string(node);
                            
                            // Add a bit of the next paragraph if available
                            if (nextNodes) {
                              const [nextNode] = nextNodes;
                              const nextText = Node.string(nextNode);
                              if (nextText) {
                                previewText += '\\n' + nextText.slice(0, 100);
                              }
                            }
                            
                            return previewText || 'No preview available';
                          } catch (error) {
                            return 'No preview available';
                          }
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
