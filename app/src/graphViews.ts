import type { Assessment, GraphData } from "./types";
import type { GraphNode } from "./components/GraphCanvas";
import { GRAPH_THEMES, PALETTE, SHAPES, type Theme } from "./theme";
import { skillLabel } from "./filters";

const BASE_SIZE = 9;
// Saved coordinates span about +/-1100; this keeps dots readable at the default zoom.
const POS_SCALE = 0.5;

interface WheelOptions {
  /** Skills to emphasize; null means nothing is filtered. */
  highlight: Set<string> | null;
  /** Skills picked in the Skill filter, drawn larger. */
  selected: Set<string>;
  /** When something is highlighted, those skills show their strong/some/none level. */
  assessment: Assessment | null;
}

// Hue is always the skill's own color. Rating is the fill (empty, half, full), the outline matches the
// dot's color, and a picked skill adds a contrasting ring and a larger size.
export function buildWheelNodes(graph: GraphData, theme: Theme, opts: WheelOptions): GraphNode[] {
  const colors = GRAPH_THEMES[theme];
  return Object.values(graph.skills).map((skill): GraphNode => {
    const on = !opts.highlight || opts.highlight.has(skill.id);
    const isSelected = opts.selected.has(skill.id);
    const color = PALETTE[theme][skill.color];
    // white dots keep a gray outline: a white outline would vanish on the light background
    const outline = skill.color === "white" ? colors.nodeBorder : color;
    const node: GraphNode = {
      id: skill.id,
      // names only appear once something is highlighted; the overview stays clean
      label: on && opts.highlight ? skillLabel(skill) : "",
      color,
      shape: SHAPES[skill.color],
      size: BASE_SIZE + Math.sqrt(skill.workRoles.length) + (on && opts.highlight ? 3 : 0) + (isSelected ? 6 : 0),
      x: skill.x * POS_SCALE,
      y: skill.y * POS_SCALE,
      faded: !on,
      fillOpacity: 1,
      borderWidth: 1,
      borderColor: outline,
      halfFill: null,
    };
    if (on && opts.assessment) {
      node.borderWidth = 2;
      const state = opts.assessment[skill.id] ?? "missing";
      if (state === "missing") node.fillOpacity = 0.15;
      else if (state === "partial") node.halfFill = `${color} ${color} ${colors.bg} ${colors.bg}`;
    }
    if (isSelected) {
      node.borderWidth = 3;
      node.borderColor = colors.ring;
    }
    return node;
  });
}
