
import { Selection } from 'd3';
import { GraphLink } from '../graphUtils';
import { LINK_COLORS } from '../graphUtils';

export const renderGraphLinks = (
  svg: Selection<SVGGElement, unknown, null, undefined>,
  links: GraphLink[]
) => {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const colors = LINK_COLORS[theme];

  // Create links
  const link = svg
    .append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', d => colors[d.type])
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.6)
    .style('pointer-events', 'none');

  // Add arrow markers for directed links
  svg.append('defs')
    .selectAll('marker')
    .data(Object.keys(colors))
    .enter()
    .append('marker')
    .attr('id', d => `arrow-${d}`)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('fill', d => colors[d])
    .attr('d', 'M0,-5L10,0L0,5');

  // Apply markers to links
  link.attr('marker-end', d => `url(#arrow-${d.type})`);

  return link;
};
