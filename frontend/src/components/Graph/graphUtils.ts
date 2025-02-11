import * as d3 from 'd3';

// Node dimensions
export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 160;
export const TAG_NODE_WIDTH = 260;
export const TAG_NODE_HEIGHT = 40;
export const ICON_SIZE = 16;
export const PADDING = 16;
export const LINE_HEIGHT = 1.4;

// Node sizes by type
export const NODE_SIZES: Record<string, { width: number; height: number }> = {
  current: { width: NODE_WIDTH * 1.2, height: NODE_HEIGHT * 1.2 },
  reference: { width: NODE_WIDTH, height: NODE_HEIGHT },
  backlink: { width: NODE_WIDTH, height: NODE_HEIGHT },
  tag: { width: TAG_NODE_WIDTH, height: TAG_NODE_HEIGHT }
};

// Colors
export const NODE_COLORS: Record<string, Record<string, string>> = {
  light: {
    current: '#3b82f6', // blue-500
    reference: '#22c55e', // green-500
    backlink: '#f59e0b', // amber-500
    tag: '#a855f7', // purple-500
    text: '#1f2937', // gray-800
    background: '#ffffff', // white
  },
  dark: {
    current: '#60a5fa', // blue-400
    reference: '#4ade80', // green-400
    backlink: '#fbbf24', // amber-400
    tag: '#c084fc', // purple-400
    text: '#f3f4f6', // gray-100
    background: '#1f2937', // gray-800
  }
};

export const LINK_COLORS: Record<string, Record<string, string>> = {
  light: {
    reference: '#9ca3af', // gray-400
    backlink: '#d97706', // amber-600
    tag: '#9333ea', // purple-600
  },
  dark: {
    reference: '#6b7280', // gray-500
    backlink: '#fbbf24', // amber-400
    tag: '#a855f7', // purple-500
  }
};

export interface NodeStyle {
  shadow: string;
  borderWidth: number;
  borderOpacity: number;
}

export type NodeType = 'current' | 'reference' | 'backlink' | 'tag';

export interface NodeStyles {
  radius: number;
  padding: number;
  fontSize: number;
  lineHeight: number;
  strokeWidth: number;
  borderWidth: number;
  borderOpacity: number;
  shadow: string;
  nodeTypes: Record<NodeType, NodeStyle>;
}

export const NODE_STYLES: NodeStyles = {
  // Common styles
  radius: 120,
  padding: 24,
  fontSize: 14,
  lineHeight: 1.4,
  strokeWidth: 2,
  borderWidth: 2,
  borderOpacity: 0.8,
  shadow: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))',

  // Node type specific styles
  nodeTypes: {
    current: {
      shadow: 'drop-shadow(0 4px 16px rgba(37, 99, 235, 0.15))',
      borderWidth: 2,
      borderOpacity: 1
    },
    reference: {
      shadow: 'drop-shadow(0 4px 16px rgba(52, 211, 153, 0.15))',
      borderWidth: 2,
      borderOpacity: 0.8
    },
    backlink: {
      shadow: 'drop-shadow(0 4px 16px rgba(251, 191, 36, 0.15))',
      borderWidth: 2,
      borderOpacity: 0.8
    },
    tag: {
      shadow: 'drop-shadow(0 4px 16px rgba(129, 140, 248, 0.15))',
      borderWidth: 2,
      borderOpacity: 0.8
    }
  }
};

// Types
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'current' | 'reference' | 'backlink' | 'tag';
  group?: string;
  size: number;
  data: any;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  value: number;
  type: string;
}

export interface NodeTypeFilter {
  current: boolean;
  reference: boolean;
  backlink: boolean;
  tag: boolean;
}

// Text utilities
export const getTextWidth = (text: string, fontSize: number): number => {
  // Approximate width calculation (can be refined with canvas measurement)
  return text.length * (fontSize * 0.6);
};

export const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = getTextWidth(currentLine + ' ' + word, fontSize);
    
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// Helper functions
export const truncateTextOld = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
};

export const getTextWidthOld = (text: string, fontSize: number) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    context.font = `${fontSize}px -apple-system, system-ui, sans-serif`;
    return context.measureText(text).width;
  }
  return 0;
};

export const wrapTextOld = (text: string, maxWidth: number, fontSize: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const width = getTextWidthOld(currentLine + ' ' + words[i], fontSize);
    if (width < maxWidth) {
      currentLine += ' ' + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
};

// Tag color generation
export const getTagColor = (tag: string) => {
  const hash = tag.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 85%, 35%)`; // More saturated, darker for better contrast
};
