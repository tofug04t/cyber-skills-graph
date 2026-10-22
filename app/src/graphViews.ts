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
  /** When roles are selected, highlighted skills show their strong/some/none level. */
  assessment: Assessment | null;
}

// Hue is always the skill's own color. Selection and assessment use fill, ring, and size only.
export function buildWheelNodes(graph: GraphData, theme: Theme, opts: WheelOptions): GraphNode[] {
  const colors = GRAPH_THEMES[theme];
  return Object.values(graph.skills).map((skill): GraphNode => {
    const on = !opts.highlight || opts.highlight.has(skill.id);
    const isSelected = opts.selected.has(skill.id);
    const node: GraphNode = {
      id: skill.id,
      // names only appear once something is highlighted; the overview stays clean
      label: on && opts.highlight ? skillLabel(skill) : "",
      color: PALETTE[theme][skill.color],
      shape: SHAPES[skill.color],
      size: BASE_SIZE + Math.sqrt(skill.workRoles.length) + (on && opts.highlight ? 3 : 0) + (isSelected ? 6 : 0),
      x: skill.x * POS_SCALE,
      y: skill.y * POS_SCALE,
      faded: !on,
      fillOpacity: 1,
      borderWidth: 1,
      borderColor: colors.nodeBorder,
    };
    if (isSelected) {
      node.borderWidth = 3;
      node.borderColor = colors.ring;
    } else if (on && opts.assessment) {
      const state = opts.assessment[skill.id] ?? "missing";
      if (state === "missing") {
        node.fillOpacity = 0.25;
        node.borderWidth = 2;
        node.borderColor = node.color;
      } else if (state === "partial") {
        node.fillOpacity = 0.6;
        node.borderWidth = 2;
        node.borderColor = node.color;
      } else {
        node.borderWidth = 3;
        node.borderColor = colors.ring;
      }
    }
    return node;
  });
}
