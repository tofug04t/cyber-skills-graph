import { useEffect, useMemo, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type cytoscape from "cytoscape";
import { GRAPH_THEMES, type Theme } from "../theme";

export interface GraphNode {
  id: string;
  label: string;
  color: string;
  shape: string;
  size: number;
  x: number;
  y: number;
  faded: boolean;
  fillOpacity: number;
  borderWidth: number;
  borderColor: string;
  /** Two-stop gradient colors (filled half, empty half) for a half-filled dot; null for a plain fill. */
  halfFill?: string | null;
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  theme: Theme;
  /** Nodes to zoom to; empty fits the whole wheel. */
  fitIds: string[];
  onNodeClick?: (id: string) => void;
  onBackgroundClick?: () => void;
}

const FADED_OPACITY = 0.14;
const MAX_FIT_ZOOM = 1.4;

export function GraphCanvas({ nodes, theme, fitIds, onNodeClick, onBackgroundClick }: GraphCanvasProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const onNodeClickRef = useRef(onNodeClick);
  const onBackgroundClickRef = useRef(onBackgroundClick);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
    onBackgroundClickRef.current = onBackgroundClick;
  });

  const elements = useMemo(
    () =>
      nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          color: n.color,
          shape: n.shape,
          size: n.size,
          opacity: n.faded ? FADED_OPACITY : 1,
          fillOpacity: n.fillOpacity,
          borderWidth: n.borderWidth,
          borderColor: n.borderColor,
          half: n.halfFill ? 1 : 0,
          halfStops: n.halfFill ?? "",
        },
        position: { x: n.x, y: n.y },
      })),
    [nodes]
  );

  const stylesheet = useMemo(() => {
    const colors = GRAPH_THEMES[theme];
    return [
      {
        selector: "node",
        style: {
          shape: "data(shape)",
          "background-color": "data(color)",
          "background-opacity": "data(fillOpacity)",
          "border-width": "data(borderWidth)",
          "border-color": "data(borderColor)",
          width: "data(size)",
          height: "data(size)",
          opacity: "data(opacity)",
          label: "data(label)",
          color: colors.label,
          "font-size": 10,
          "text-outline-width": 2,
          "text-outline-color": colors.labelOutline,
          "text-valign": "top",
          "text-margin-y": -4,
          // labels only appear once zoomed in far enough to read them
          "min-zoomed-font-size": 9,
        },
      },
      {
        // "Some": the lower half in the skill's color, the upper half empty
        selector: "node[half = 1]",
        style: {
          "background-fill": "linear-gradient",
          "background-gradient-direction": "to-top",
          "background-gradient-stop-colors": "data(halfStops)",
          "background-gradient-stop-positions": "0% 50% 50% 100%",
        },
      },
    ] as unknown as cytoscape.StylesheetJsonBlock[];
  }, [theme]);

  const fitKey = fitIds.join(",");

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const fit = () => {
      cy.resize();
      const wanted = fitKey ? new Set(fitKey.split(",")) : null;
      const targets = wanted ? cy.nodes().filter((n) => wanted.has(n.id())) : cy.nodes();
      if (targets.length === 0) return;
      // padding shrinks with the pane so a short phone map still zooms in
      cy.fit(targets, Math.min(wanted ? 80 : 50, cy.height() * 0.12));
      if (cy.zoom() > MAX_FIT_ZOOM) {
        cy.zoom(MAX_FIT_ZOOM);
        cy.center(targets);
      }
    };

    // Two frames: at mount the flex container may not have its final size yet.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(fit);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [fitKey]);

  return (
    <CytoscapeComponent
      elements={elements}
      stylesheet={stylesheet}
      layout={{ name: "preset" }}
      style={{ width: "100%", height: "100%" }}
      cy={(cy) => {
        if (cyRef.current === cy) return;
        cyRef.current = cy;
        cy.on("tap", "node", (evt) => onNodeClickRef.current?.(evt.target.id()));
        cy.on("tap", (evt) => {
          if (evt.target === cy) onBackgroundClickRef.current?.();
        });
      }}
      minZoom={0.1}
      maxZoom={6}
    />
  );
}
