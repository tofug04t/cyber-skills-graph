import type { Assessment, GraphData } from "./types";
import type { GraphEdge, GraphNode } from "./components/GraphCanvas";
import { ASSESSMENT_HAVE, ASSESSMENT_PARTIAL, CATEGORY_COLORS } from "./constants";
import { GRAPH_THEMES, type Theme } from "./theme";
import { skillLabel } from "./filters";

const ROLE_BASE_SIZE = 14;
const SKILL_BASE_SIZE = 6;

interface GraphElements {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildOverviewElements(graph: GraphData, theme: Theme): GraphElements {
  const colors = GRAPH_THEMES[theme];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const role of Object.values(graph.workRoles)) {
    nodes.push({
      id: role.id,
      label: role.title,
      kind: "workRole",
      color: CATEGORY_COLORS[role.category] ?? "#888",
      size: ROLE_BASE_SIZE + Math.sqrt(role.skills.length) * 2,
    });
  }

  for (const skill of Object.values(graph.skills)) {
    nodes.push({
      id: skill.id,
      label: "",
      kind: "skill",
      color: colors.skill,
      size: SKILL_BASE_SIZE + Math.sqrt(skill.workRoles.length),
    });
    for (const roleId of skill.workRoles) {
      edges.push({ id: `${roleId}-${skill.id}`, source: roleId, target: skill.id });
    }
  }

  return { nodes, edges };
}

export function applyHighlight(
  graph: GraphData,
  base: GraphElements,
  roleIds: Set<string>,
  skillIds: Set<string>,
  theme: Theme
): GraphElements {
  const colors = GRAPH_THEMES[theme];
  const nodes = base.nodes.map((n): GraphNode => {
    if (n.kind === "workRole") {
      const on = roleIds.has(n.id);
      return { ...n, faded: !on, size: on ? n.size + 4 : n.size };
    }
    const on = skillIds.has(n.id);
    if (!on) return { ...n, faded: true };
    return {
      ...n,
      faded: false,
      color: colors.selectedSkill,
      size: SKILL_BASE_SIZE + 8,
      label: skillLabel(graph.skills[n.id]),
    };
  });
  const edges = base.edges.map(
    (e): GraphEdge => ({ ...e, faded: !(roleIds.has(e.source) && skillIds.has(e.target)) })
  );
  return { nodes, edges };
}

export function buildGapElements(
  graph: GraphData,
  targetRoleId: string,
  assessment: Assessment,
  theme: Theme
): GraphElements {
  const role = graph.workRoles[targetRoleId];
  if (!role) return { nodes: [], edges: [] };
  const colors = GRAPH_THEMES[theme];
  const byValue = { have: ASSESSMENT_HAVE, partial: ASSESSMENT_PARTIAL, missing: colors.missing };

  const nodes: GraphNode[] = [
    {
      id: role.id,
      label: role.title,
      kind: "workRole",
      color: CATEGORY_COLORS[role.category] ?? "#888",
      size: ROLE_BASE_SIZE + 10,
    },
  ];
  const edges: GraphEdge[] = [];

  for (const skillId of role.skills) {
    const skill = graph.skills[skillId];
    if (!skill) continue;
    nodes.push({
      id: skill.id,
      label: skillLabel(skill),
      kind: "skill",
      color: byValue[assessment[skillId] ?? "missing"],
      size: SKILL_BASE_SIZE + 4,
    });
    edges.push({ id: `${role.id}-${skill.id}`, source: role.id, target: skill.id });
  }

  return { nodes, edges };
}
