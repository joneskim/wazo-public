import * as d3 from 'd3';
import { Selection } from 'd3';
import { GraphNode, NodeType } from '../graphUtils';
import { NODE_COLORS, NODE_STYLES } from '../graphUtils';
import { truncateText } from '../graphUtils';

export const renderTagNode = (
  node: Selection<SVGGElement, GraphNode, null, undefined>,
  d: GraphNode,
  onNodeClick: (id: string) => void,
  isDarkMode: boolean = false
) => {
  const theme = isDarkMode ? 'dark' : 'light';
  const colors = NODE_COLORS[theme];
  const nodeType = d.type as NodeType;
  const width = NODE_STYLES.radius * 1.6;
  const height = NODE_STYLES.radius * 0.8;
  const tagText = truncateText(d.id.replace(/^tag-/, '').replace(/#/, ''), 15);

  // Add drop shadow filter
  const shadowId = `shadow-${d.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const defs = node.append('defs');
  const filter = defs.append('filter')
    .attr('id', shadowId)
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');

  filter.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', '2')
    .attr('result', 'blur');

  filter.append('feOffset')
    .attr('in', 'blur')
    .attr('dx', '0')
    .attr('dy', '2')
    .attr('result', 'offsetBlur');

  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode')
    .attr('in', 'offsetBlur');
  feMerge.append('feMergeNode')
    .attr('in', 'SourceGraphic');

  // Background rectangle
  node.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('x', -width / 2)
    .attr('y', -height / 2)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('fill', colors.background)
    .attr('stroke', colors[nodeType])
    .attr('stroke-width', NODE_STYLES.strokeWidth)
    .style('filter', `url(#${shadowId})`)
    .attr('cursor', 'pointer')
    .on('click', () => onNodeClick(d.id));

  // Tag text with hash
  node.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', NODE_STYLES.fontSize * 0.3)
    .attr('fill', colors.text)
    .attr('font-size', NODE_STYLES.fontSize * 1.1)
    .attr('font-weight', '500')
    .text(`#${tagText}`);

  // Hover effects
  node
    .on('mouseover', function() {
      d3.select(this).select('rect')
        .transition()
        .duration(200)
        .attr('transform', 'scale(1.1)')
        .attr('stroke-width', NODE_STYLES.strokeWidth * 1.5);
    })
    .on('mouseout', function() {
      d3.select(this).select('rect')
        .transition()
        .duration(200)
        .attr('transform', 'scale(1)')
        .attr('stroke-width', NODE_STYLES.strokeWidth);
    });
};
