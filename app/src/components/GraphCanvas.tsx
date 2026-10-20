import { useEffect, useMemo, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type cytoscape from "cytoscape";
import { GRAPH_THEMES, type Theme } from "../theme";

export interface GraphNode {
  id: string;
  label: string;
  kind: "workRole" | "skill";
  color: string;
  size: number;
  faded?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  faded?: boolean;
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  theme: Theme;
  /** Layout re-runs only when this changes; styling changes never relayout. */
  layoutKey: string;
  /** Nodes to zoom to; empty fits the whole graph. */
  fitIds: string[];
  onNodeClick?: (id: string, kind: "workRole" | "skill") => void;
  onBackgroundClick?: () => void;
}

type Positions = Record<string, { x: number; y: number }>;

const FADED_NODE_OPACITY = 0.14;
const FADED_EDGE_OPACITY = 0.05;
const MAX_FIT_ZOOM = 1.2;

export function GraphCanvas({
  nodes,
  edges,
  theme,
  layoutKey,
  fitIds,
  onNodeClick,
  onBackgroundClick,
}: GraphCanvasProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const positionsRef = useRef<Map<string, Positions>>(new Map());
  const lastLayoutKeyRef = useRef<string | null>(null);
  const nodeCountRef = useRef(nodes.length);
  const onNodeClickRef = useRef(onNodeClick);
  const onBackgroundClickRef = useRef(onBackgroundClick);

  useEffect(() => {
    nodeCountRef.current = nodes.length;
    onNodeClickRef.current = onNodeClick;
    onBackgroundClickRef.current = onBackgroundClick;
  });

  const elements = useMemo(
    () => [
      ...nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          color: n.color,
          size: n.size,
          opacity: n.faded ? FADED_NODE_OPACITY : 1,
          kind: n.kind,
        },
      })),
      ...edges.map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          opacity: e.faded ? FADED_EDGE_OPACITY : 0.6,
        },
      })),
    ],
    [nodes, edges]
  );

  const stylesheet = useMemo(() => {
    const colors = GRAPH_THEMES[theme];
    return [
      {
        selector: "node",
        style: {
          "background-color": "data(color)",
          width: "data(size)",
          height: "data(size)",
          opacity: "data(opacity)",
        },
      },
      {
        selector: "node[label]",
        style: {
          label: "data(label)",
          color: colors.label,
          "font-size": 10,
          "text-outline-width": 2,
          "text-outline-color": colors.labelOutline,
          "text-valign": "top",
          "text-margin-y": -4,
        },
      },
      {
        selector: "edge",
        style: {
          width: 0.75,
          "line-color": colors.edge,
          "curve-style": "haystack",
          opacity: "data(opacity)",
        },
      },
    ] as cytoscape.StylesheetJsonBlock[];
  }, [theme]);

  const fitKey = fitIds.join(",");

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const fit = () => {
      const targets = fitKey ? cy.nodes().filter((n) => fitKey.split(",").includes(n.id())) : cy.nodes();
      if (targets.length === 0) {
        cy.fit(undefined, 40);
        return;
      }
      cy.fit(targets, fitKey ? 70 : 40);
      if (cy.zoom() > MAX_FIT_ZOOM) {
        cy.zoom(MAX_FIT_ZOOM);
        cy.center(targets);
      }
    };

    const runLayout = () => {
      cy.resize();
      if (lastLayoutKeyRef.current !== layoutKey) {
        lastLayoutKeyRef.current = layoutKey;
        const cached = positionsRef.current.get(layoutKey);
        if (cached) {
          cy.layout({
            name: "preset",
            positions: (node: cytoscape.NodeSingular) => cached[node.id()] ?? { x: 0, y: 0 },
          } as cytoscape.LayoutOptions).run();
        } else {
          cy.layout({
            name: "cose",
            animate: false,
            nodeRepulsion: 400000,
            idealEdgeLength: 40,
            numIter: nodeCountRef.current > 100 ? 300 : 1000,
            fit: false,
          } as cytoscape.LayoutOptions).run();
          const saved: Positions = {};
          cy.nodes().forEach((n) => {
            saved[n.id()] = { ...n.position() };
          });
          positionsRef.current.set(layoutKey, saved);
        }
      }
      fit();
    };

    // Two frames: at mount the flex container may not have its final size yet.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(runLayout);
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [layoutKey, fitKey]);

  return (
    <CytoscapeComponent
      elements={elements}
      stylesheet={stylesheet}
      style={{ width: "100%", height: "100%" }}
      cy={(cy) => {
        if (cyRef.current === cy) return;
        cyRef.current = cy;
        cy.on("tap", "node", (evt) => {
          const node = evt.target;
          onNodeClickRef.current?.(node.id(), node.data("kind"));
        });
        cy.on("tap", (evt) => {
          if (evt.target === cy) onBackgroundClickRef.current?.();
        });
      }}
      minZoom={0.1}
      maxZoom={6}
    />
  );
}
