declare module 'react-cytoscapejs' {
  import { Component } from 'react';
  import cytoscape from 'cytoscape';

  export interface CytoscapeComponentProps {
    id?: string;
    cy?: (cy: cytoscape.Core) => void;
    style?: React.CSSProperties;
    elements: cytoscape.ElementDefinition[];
    layout?: cytoscape.LayoutOptions;
    stylesheet?: cytoscape.Stylesheet[];
    className?: string;
    zoom?: number;
    pan?: { x: number; y: number };
    minZoom?: number;
    maxZoom?: number;
    zoomingEnabled?: boolean;
    userZoomingEnabled?: boolean;
    panningEnabled?: boolean;
    userPanningEnabled?: boolean;
    boxSelectionEnabled?: boolean;
    autoungrabify?: boolean;
    autounselectify?: boolean;
    wheelSensitivity?: number;
    motionBlur?: boolean;
    motionBlurOpacity?: number;
    pixelRatio?: number;
    hideEdgesOnViewport?: boolean;
    textureOnViewport?: boolean;
    touchTapThreshold?: number;
    desktopTapThreshold?: number;
    hideLabelsOnViewport?: boolean;
  }

  export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {}
}
