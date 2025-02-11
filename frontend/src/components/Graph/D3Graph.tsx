import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Note } from '../../types';
import { parseJsonArray } from '../../utils/jsonUtils';
import NotePreview from './NotePreview';
import { ConnectionPanel } from './ConnectionPanel';
import {
  NODE_WIDTH,
  TAG_NODE_WIDTH,
  GraphNode,
  GraphLink,
  NodeTypeFilter,
  NODE_SIZES
} from './graphUtils';
import { renderTagNode } from './nodes/TagNode';
import { renderNoteNode } from './nodes/NoteNode';

interface D3GraphProps {
  currentNote: Note;
  references: Note[];
  backlinks: Note[];
  tagRelatedNotes: Note[];
  notes: Note[];
  onNodeClick: (noteId: string) => void;
  onUpdateNote?: (update: Partial<Note>) => Promise<void>;
}

const D3Graph: React.FC<D3GraphProps> = ({
  currentNote,
  references,
  backlinks,
  tagRelatedNotes,
  notes,
  onNodeClick,
  onUpdateNote,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeTypeFilter>({
    current: true,
    reference: true,
    backlink: true,
    tag: false,
  });
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const allNodes = useMemo(() => {
    const nodes: GraphNode[] = [];

    // Add current note
    nodes.push({
      id: currentNote.id,
      type: 'current',
      data: currentNote,
      size: NODE_SIZES.current.width,
    });

    // Add references
    references.forEach(note => {
      nodes.push({
        id: note.id,
        type: 'reference',
        data: note,
        size: NODE_SIZES.reference.width,
      });
    });

    // Add backlinks
    backlinks.forEach(note => {
      if (!nodes.some(n => n.id === note.id)) {
        nodes.push({
          id: note.id,
          type: 'backlink',
          data: note,
          size: NODE_SIZES.backlink.width,
        });
      }
    });

    // Add all other notes that aren't already included
    notes.forEach(note => {
      if (!nodes.some(n => n.id === note.id)) {
        nodes.push({
          id: note.id,
          type: 'reference', // Use reference type for other notes
          data: note,
          size: NODE_SIZES.reference.width,
        });
      }
    });

    return nodes;
  }, [currentNote, references, backlinks, notes]);

  const filteredNodes = useMemo(() => {
    const nodes: GraphNode[] = [];
    const connectedNodeIds = new Set<string>();

    // Add current note
    if (nodeTypeFilter.current) {
      nodes.push({
        id: currentNote.id,
        type: 'current',
        size: NODE_WIDTH,
        data: currentNote,
      });
      connectedNodeIds.add(currentNote.id);
    }

    // Add reference notes
    if (nodeTypeFilter.reference) {
      references.forEach(note => {
        if (!connectedNodeIds.has(note.id)) {
          nodes.push({
            id: note.id,
            type: 'reference',
            size: NODE_WIDTH,
            data: note,
          });
          connectedNodeIds.add(note.id);
        }
      });
    }

    // Add backlink notes
    if (nodeTypeFilter.backlink) {
      backlinks.forEach(note => {
        if (!connectedNodeIds.has(note.id)) {
          nodes.push({
            id: note.id,
            type: 'backlink',
            size: NODE_WIDTH,
            data: note,
          });
          connectedNodeIds.add(note.id);
        }
      });
    }

    // Add tags
    if (nodeTypeFilter.tag) {
      const allTags = new Set<string>();
      [currentNote, ...references, ...backlinks].forEach(note => {
        parseJsonArray(note.tags).forEach(tag => allTags.add(tag));
      });

      allTags.forEach(tag => {
        nodes.push({
          id: `tag-${tag}`,
          type: 'tag',
          size: TAG_NODE_WIDTH,
          data: { content: tag },
        });
      });
    }

    return nodes;
  }, [currentNote, references, backlinks, nodeTypeFilter]);

  const filteredLinks = useMemo(() => {
    const result: GraphLink[] = [];

    // Reference links
    if (nodeTypeFilter.reference) {
      references.forEach(note => {
        result.push({
          source: filteredNodes.find(n => n.id === currentNote.id)!,
          target: filteredNodes.find(n => n.id === note.id)!,
          value: 1,
          type: 'reference',
        });
      });
    }

    // Backlink links
    if (nodeTypeFilter.backlink) {
      backlinks.forEach(note => {
        result.push({
          source: filteredNodes.find(n => n.id === note.id)!,
          target: filteredNodes.find(n => n.id === currentNote.id)!,
          value: 1,
          type: 'backlink',
        });
      });
    }

    // Tag links
    if (nodeTypeFilter.tag) {
      filteredNodes
        .filter(node => node.type !== 'tag')
        .forEach(node => {
          const noteTags = parseJsonArray(node.data.tags);
          noteTags.forEach(tag => {
            const tagNode = filteredNodes.find(n => n.id === `tag-${tag}`);
            if (tagNode) {
              result.push({
                source: node,
                target: tagNode,
                value: 1,
                type: 'tag',
              });
            }
          });
        });
    }

    return result;
  }, [filteredNodes, currentNote.id, references, backlinks, nodeTypeFilter]);

  const handleNodeClick = useCallback((nodeId: string) => {
    console.log('Node clicked:', nodeId);
    const node = filteredNodes.find(n => n.id === nodeId);
    if (node && node.type !== 'tag') {
      console.log('Opening connection panel for node:', node);
      setSelectedNode(node);
      setShowConnectionPanel(true);
      // Update the current note ID in localStorage
      localStorage.setItem('selectedNoteId', nodeId);
      // Call the onNodeClick callback
      onNodeClick?.(nodeId);
    } else if (node && node.type === 'tag') {
      handleTagClick(node.id.replace(/^tag-/, ''));
    }
  }, [filteredNodes, onNodeClick]);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag);
  }, [selectedTag]);

  const handleConnect = useCallback(async (sourceId: string, targetId: string) => {
    if (!onUpdateNote) return;

    // Get the source node
    const sourceNode = allNodes.find(n => n.id === sourceId);
    if (!sourceNode || !sourceNode.data) return;

    // Get current references
    const currentRefs = parseJsonArray(sourceNode.data.references);

    // Add new reference if it doesn't exist
    if (!currentRefs.includes(targetId)) {
      const updatedRefs = [...currentRefs, targetId];
      console.log('Updating references:', updatedRefs);
      
      try {
        await onUpdateNote({
          id: sourceId,
          references: JSON.stringify(updatedRefs)
        });
        console.log('Successfully updated references');
      } catch (error) {
        console.error('Failed to update references:', error);
      }
    }
  }, [allNodes, onUpdateNote]);

  const handleAddConnection = useCallback(() => {
    if (hoveredNode) {
      console.log('Opening connection panel for node:', hoveredNode);
      setSelectedNode(hoveredNode);
      setShowConnectionPanel(true);
    }
  }, [hoveredNode]);

  useEffect(() => {
    console.log('Connection Panel State:', { showConnectionPanel, selectedNode });
  }, [showConnectionPanel, selectedNode]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear existing SVG content
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll('*').remove();

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const container = svg.select('g');
        container.attr('transform', event.transform);
      });

    // Apply zoom to SVG
    svg.call(zoom as any);

    // Create container group for zooming
    const container = svg.append('g');

    // Create links
    const linkElements = container
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(filteredLinks)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    // Create nodes
    const nodeElements = container
      .selectAll<SVGGElement, GraphNode>('g')
      .data(filteredNodes)
      .join('g')
      .attr('class', 'node')
      .on('mouseover', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseout', () => {
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        console.log('Node clicked:', d);
        if (d.type !== 'tag') {
          setSelectedNode(d);
          setShowConnectionPanel(true);
        } else {
          handleTagClick(d.id.replace(/^tag-/, ''));
        }
      });

    // Set up drag behavior
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeElements.call(drag as any);

    // Set up force simulation
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredLinks).id(d => d.id).distance(200))
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(180).strength(1));

    // Update positions on simulation tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Render node contents
    nodeElements.each(function(d) {
      const nodeElement = d3.select(this);
      const isDarkMode = document.documentElement.classList.contains('dark');
      if (d.type === 'tag') {
        renderTagNode(nodeElement as any, d, handleTagClick, isDarkMode);
      } else {
        renderNoteNode(nodeElement as any, d, handleNodeClick, isDarkMode);
      }
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, handleNodeClick, handleTagClick]);

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-900 mt-14">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Node Type Key */}
      <div className="absolute top-4 left-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 mt-14">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Node Types</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={nodeTypeFilter.current}
              onChange={() => setNodeTypeFilter(prev => ({ ...prev, current: !prev.current }))}
              className="form-checkbox h-4 w-4 text-emerald-500 rounded border-gray-300 dark:border-gray-600"
            />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Current Note</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={nodeTypeFilter.reference}
              onChange={() => setNodeTypeFilter(prev => ({ ...prev, reference: !prev.reference }))}
              className="form-checkbox h-4 w-4 text-pink-500 rounded border-gray-300 dark:border-gray-600"
            />
            <div className="w-3 h-3 rounded-full bg-pink-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">References</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={nodeTypeFilter.backlink}
              onChange={() => setNodeTypeFilter(prev => ({ ...prev, backlink: !prev.backlink }))}
              className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 dark:border-gray-600"
            />
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Backlinks</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={nodeTypeFilter.tag}
              onChange={() => setNodeTypeFilter(prev => ({ ...prev, tag: !prev.tag }))}
              className="form-checkbox h-4 w-4 text-violet-500 rounded border-gray-300 dark:border-gray-600"
            />
            <div className="w-3 h-3 rounded-full bg-violet-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Tags</span>
          </label>
        </div>
      </div>

      {/* Connection Button */}
      {hoveredNode && hoveredNode.type !== 'tag' && (
        <button
          onClick={handleAddConnection}
          className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10"
        >
          Add Connection
        </button>
      )}

      {/* Note Preview */}
      {hoveredNode && hoveredNode.type !== 'tag' && (
        <div className="absolute bottom-4 left-4 max-w-md z-10">
          <NotePreview note={hoveredNode.data} />
        </div>
      )}

      {/* Connection Panel */}
      <div className="absolute top-20 right-4 w-80 z-20">
        <ConnectionPanel
          isOpen={showConnectionPanel}
          onClose={() => {
            console.log('Closing connection panel');
            setShowConnectionPanel(false);
            setSelectedNode(null);
          }}
          onConnect={(targetId) => {
            console.log('Connecting nodes:', selectedNode?.id, targetId);
            if (selectedNode) {
              handleConnect(selectedNode.id, targetId);
            }
            setShowConnectionPanel(false);
            setSelectedNode(null);
          }}
          sourceNode={selectedNode}
          availableNodes={allNodes.filter(n => 
            n.type !== 'tag' && 
            (!selectedNode || n.id !== selectedNode.id)
          )}
        />
      </div>
    </div>
  );
};

export default D3Graph;
