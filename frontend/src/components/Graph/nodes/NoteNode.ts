import * as d3 from 'd3';
import { Selection } from 'd3';
import { GraphNode, NodeType } from '../graphUtils';
import { NODE_COLORS, NODE_STYLES } from '../graphUtils';
import { truncateText, getTextWidth, wrapText } from '../graphUtils';
import { getNoteTitle, getNotePreview } from '../../../utils/noteUtils';
import { parseJsonArray } from '../../../utils/jsonUtils';

export const renderNoteNode = (
  node: Selection<SVGGElement, GraphNode, null, undefined>,
  d: GraphNode,
  onNodeClick: (id: string) => void,
  isDarkMode: boolean = false
) => {
  const theme = isDarkMode ? 'dark' : 'light';
  const colors = NODE_COLORS[theme];
  const nodeType = d.type as NodeType;
  const size = NODE_STYLES.radius * 2;
  const padding = NODE_STYLES.padding;
  const maxContentWidth = size - (padding * 2.5);

  // Create a unique ID for this node's gradient
  const gradientId = `gradient-${d.id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Define gradient
  const defs = node.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', colors.background)
    .attr('stop-opacity', 1);

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', colors.background)
    .attr('stop-opacity', 0.95);

  // Add drop shadow filter
  const shadowId = `shadow-${d.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const filter = defs.append('filter')
    .attr('id', shadowId)
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');

  filter.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', '4')
    .attr('result', 'blur');

  filter.append('feOffset')
    .attr('in', 'blur')
    .attr('dx', '0')
    .attr('dy', '4')
    .attr('result', 'offsetBlur');

  filter.append('feFlood')
    .attr('flood-color', colors[nodeType])
    .attr('flood-opacity', '0.2')
    .attr('result', 'coloredShadow');

  filter.append('feComposite')
    .attr('in', 'coloredShadow')
    .attr('in2', 'offsetBlur')
    .attr('operator', 'in')
    .attr('result', 'coloredShadow');

  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode')
    .attr('in', 'coloredShadow');
  feMerge.append('feMergeNode')
    .attr('in', 'SourceGraphic');

  // Background rectangle with gradient
  node.append('rect')
    .attr('class', 'node-bg')
    .attr('width', size)
    .attr('height', size * 0.9)
    .attr('x', -size / 2)
    .attr('y', -(size * 0.75) / 2)
    .attr('rx', 16)
    .attr('ry', 16)
    .attr('fill', `url(#${gradientId})`)
    .attr('stroke', colors[nodeType])
    .attr('stroke-width', NODE_STYLES.strokeWidth)
    .style('filter', `url(#${shadowId})`)
    .attr('cursor', 'pointer')
    .on('click', () => onNodeClick(d.id));

  // Title text
  const title = getNoteTitle(d.data.content);
  const titleLines = wrapText(title, maxContentWidth, NODE_STYLES.fontSize * 1.4);
  titleLines.slice(0, 2).forEach((line, i) => {
    node.append('text')
      .attr('class', 'title')
      .attr('x', -size / 2 + padding)
      .attr('y', -(size * 0.85) / 2 + padding + (NODE_STYLES.fontSize * 1.4) * (i + 1))
      .attr('fill', colors.text)
      .attr('font-size', NODE_STYLES.fontSize * 1.4)
      .attr('font-weight', '600')
      .text(i === titleLines.length - 1 ? truncateText(line, 35) : line);
  });

  // Preview text
  const preview = getNotePreview(d.data.content);
  if (preview) {
    const lines = wrapText(preview, maxContentWidth, NODE_STYLES.fontSize).slice(0, 3);
    lines.forEach((line, i) => {
      node.append('text')
        .attr('class', 'preview')
        .attr('x', -size / 2 + padding)
        .attr('y', -(size * 0.85) / 2 + padding + (NODE_STYLES.fontSize * 1.4) * (titleLines.length + 1) + 12 + (i * NODE_STYLES.fontSize * 1.6))
        .attr('fill', colors.text)
        .attr('opacity', 0.7)
        .attr('font-size', NODE_STYLES.fontSize)
        .text(truncateText(line, 40));
    });
  }

  // Tags section with background
  const tags = parseJsonArray(d.data.tags);
  if (tags.length > 0) {
    // Tag section background
    const tagSectionHeight = NODE_STYLES.fontSize * 3;
    node.append('rect')
      .attr('x', -size / 2)
      .attr('y', (size * 0.85) / 2 - tagSectionHeight)
      .attr('width', size)
      .attr('height', tagSectionHeight)
      .attr('fill', colors[nodeType])
      .attr('opacity', 0.05)
      .attr('rx', 16)
      .attr('ry', 16);

    let currentX = -size / 2 + padding;
    const startY = (size * 0.85) / 2 - tagSectionHeight / 2;

    // Container for tags
    const tagContainer = node.append('g')
      .attr('class', 'tags')
      .attr('transform', 'translate(0, 0)');

    tags.slice(0, 3).forEach((tag) => {
      const tagText = truncateText(tag, 10);
      const tagWidth = Math.min(getTextWidth(tagText, NODE_STYLES.fontSize) + 24, 80);

      if (currentX + tagWidth > size / 2 - padding) {
        return;
      }

      const tagGroup = tagContainer.append('g')
        .attr('transform', `translate(${currentX}, ${startY})`);

      // Tag background
      tagGroup.append('rect')
        .attr('rx', NODE_STYLES.fontSize)
        .attr('ry', NODE_STYLES.fontSize)
        .attr('width', tagWidth)
        .attr('height', NODE_STYLES.fontSize * 2)
        .attr('fill', colors[nodeType])
        .attr('opacity', 0.15);

      // Tag text
      tagGroup.append('text')
        .attr('x', tagWidth / 2)
        .attr('y', NODE_STYLES.fontSize * 1.3)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.text)
        .attr('font-weight', '500')
        .attr('font-size', NODE_STYLES.fontSize)
        .text(`#${tagText}`);

      currentX += tagWidth + 12;
    });

    if (tags.length > 3) {
      tagContainer.append('text')
        .attr('x', currentX)
        .attr('y', startY + NODE_STYLES.fontSize * 1.3)
        .attr('fill', colors.text)
        .attr('opacity', 0.7)
        .attr('font-size', NODE_STYLES.fontSize)
        .text(`+${tags.length - 3}`);
    }
  }

  // Hover effects
  node
    .on('mouseover', function() {
      d3.select(this).select('rect.node-bg')
        .transition()
        .duration(200)
        .attr('transform', 'scale(1.02)')
        .attr('stroke-width', NODE_STYLES.strokeWidth * 1.5);
    })
    .on('mouseout', function() {
      d3.select(this).select('rect.node-bg')
        .transition()
        .duration(200)
        .attr('transform', 'scale(1)')
        .attr('stroke-width', NODE_STYLES.strokeWidth);
    });
};
