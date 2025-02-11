import { Node, Edge } from 'reactflow';
import { Note } from '../../types';
import { parseJsonArray } from '../../utils/jsonUtils';
import * as d3 from 'd3';

// Force simulation constants
const FORCE_STRENGTH = 0.3;
const CENTER_STRENGTH = 1;
const LINK_DISTANCE = 150;
const CHARGE_STRENGTH = -500;
const COLLISION_RADIUS = 100;
const ALPHA_DECAY = 0.02;

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  type?: string;
  group?: string;
  radius: number;
  x?: number;
  y?: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: string;
  target: string;
  value: number;
}

function createForceLayout(
  nodes: SimulationNode[],
  links: SimulationLink[],
  centerNode: SimulationNode
) {
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id((d: any) => d.id)
      .distance(LINK_DISTANCE)
      .strength(FORCE_STRENGTH))
    .force('charge', d3.forceManyBody()
      .strength(CHARGE_STRENGTH))
    .force('collide', d3.forceCollide()
      .radius(COLLISION_RADIUS)
      .strength(0.7))
    .force('x', d3.forceX()
      .strength((d: any) => d === centerNode ? CENTER_STRENGTH : 0.05))
    .force('y', d3.forceY()
      .strength((d: any) => d === centerNode ? CENTER_STRENGTH : 0.05))
    .force('radial', d3.forceRadial(
      (d: any) => d === centerNode ? 0 : getRadialDistance(d),
      0,
      0
    ).strength(0.3));

  simulation.alphaDecay(ALPHA_DECAY);
  
  // Run the simulation
  for (let i = 0; i < 300; ++i) simulation.tick();
  
  return nodes;
}

function getRadialDistance(node: SimulationNode): number {
  switch (node.type) {
    case 'reference':
      return 250;
    case 'backlink':
      return 400;
    case 'tag':
      return node.group === 'primary' ? 300 : 500;
    default:
      return 350;
  }
}

function groupNodesByTags(notes: Note[], currentTags: string[]): Map<string, Note[]> {
  const groups = new Map<string, Note[]>();
  
  notes.forEach(note => {
    const noteTags = parseJsonArray(note.tags);
    const sharedTags = noteTags.filter(tag => currentTags.includes(tag));
    
    if (sharedTags.length > 0) {
      // Sort by tag frequency
      const primaryTag = sharedTags.sort((a, b) => {
        const aCount = notes.filter(n => parseJsonArray(n.tags).includes(a)).length;
        const bCount = notes.filter(n => parseJsonArray(n.tags).includes(b)).length;
        return bCount - aCount;
      })[0];
      
      if (!groups.has(primaryTag)) {
        groups.set(primaryTag, []);
      }
      groups.get(primaryTag)?.push(note);
    }
  });
  
  return groups;
}

export function createGraphElements(
  currentNote: Note,
  allNotes: Note[],
  backlinks: Note[],
  references: Note[],
  tagRelatedNotes: Note[]
): { nodes: Node[]; edges: Edge[] } {
  // Prepare simulation nodes
  const simulationNodes: SimulationNode[] = [];
  const simulationLinks: SimulationLink[] = [];
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Add current note
  const centerNode: SimulationNode = {
    id: currentNote.id,
    radius: 50,
    type: 'current'
  };
  simulationNodes.push(centerNode);

  // Add reference nodes
  references.forEach(note => {
    simulationNodes.push({
      id: note.id,
      radius: 40,
      type: 'reference'
    });
    simulationLinks.push({
      source: currentNote.id,
      target: note.id,
      value: 2
    });
  });

  // Add backlink nodes
  backlinks.forEach(note => {
    if (!simulationNodes.find(n => n.id === note.id)) {
      simulationNodes.push({
        id: note.id,
        radius: 40,
        type: 'backlink'
      });
    }
    simulationLinks.push({
      source: note.id,
      target: currentNote.id,
      value: 2
    });
  });

  // Group tag-related notes
  const currentTags = parseJsonArray(currentNote.tags);
  const tagGroups = groupNodesByTags(tagRelatedNotes, currentTags);

  // Add tag-related nodes
  tagGroups.forEach((groupNotes, tag) => {
    // Add tag cluster node
    const clusterId = `cluster-${tag}`;
    simulationNodes.push({
      id: clusterId,
      radius: 30,
      type: 'tagCluster',
      group: tag
    });
    simulationLinks.push({
      source: currentNote.id,
      target: clusterId,
      value: 1
    });

    // Add notes in the cluster
    groupNotes.forEach(note => {
      if (!simulationNodes.find(n => n.id === note.id)) {
        simulationNodes.push({
          id: note.id,
          radius: 35,
          type: 'tag',
          group: 'primary'
        });
        simulationLinks.push({
          source: clusterId,
          target: note.id,
          value: 1
        });
      }
    });
  });

  // Run force simulation
  const positionedNodes = createForceLayout(simulationNodes, simulationLinks, centerNode);

  // Create React Flow nodes
  positionedNodes.forEach(node => {
    if (node.type === 'tagCluster') {
      nodes.push({
        id: node.id,
        type: 'noteNode',
        position: { x: node.x || 0, y: node.y || 0 },
        data: {
          noteId: node.id,
          content: `#${node.group}`,
          tags: [node.group as string],
          references: [],
          backlinks: [],
          type: 'tagCluster',
          isClusterLabel: true
        }
      });
    } else {
      const noteData = node.id === currentNote.id ? currentNote :
        [...references, ...backlinks, ...tagRelatedNotes].find(n => n.id === node.id);
      
      if (noteData) {
        nodes.push({
          id: node.id,
          type: 'noteNode',
          position: { x: node.x || 0, y: node.y || 0 },
          data: {
            noteId: noteData.id,
            content: noteData.content,
            tags: parseJsonArray(noteData.tags),
            references: parseJsonArray(noteData.references),
            backlinks: parseJsonArray(noteData.backlinks),
            created_at: noteData.created_at,
            last_modified: noteData.last_modified,
            type: node.type === 'current' ? undefined : node.type,
            isCurrentNote: node.type === 'current'
          }
        });
      }
    }
  });

  // Create edges
  simulationLinks.forEach(link => {
    const edgeStyle = getEdgeStyle(
      simulationNodes.find(n => n.id === link.source)?.type,
      simulationNodes.find(n => n.id === link.target)?.type
    );

    edges.push({
      id: `${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: true,
      style: edgeStyle
    });
  });

  return { nodes, edges };
}

function getEdgeStyle(sourceType?: string, targetType?: string) {
  if (sourceType === 'current' && targetType === 'reference') {
    return { stroke: '#22c55e', strokeWidth: 2 };
  }
  if (sourceType === 'backlink' && targetType === 'current') {
    return { stroke: '#f59e0b', strokeWidth: 2 };
  }
  if (sourceType === 'tagCluster' || targetType === 'tagCluster') {
    return { stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5,5' };
  }
  return { stroke: '#94a3b8', strokeWidth: 1 };
}
