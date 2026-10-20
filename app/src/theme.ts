export type Theme = "dark" | "light";

export interface GraphTheme {
  skill: string;
  selectedSkill: string;
  missing: string;
  label: string;
  labelOutline: string;
  edge: string;
}

export const GRAPH_THEMES: Record<Theme, GraphTheme> = {
  dark: {
    skill: "#7a7a86",
    selectedSkill: "#e5e5e5",
    missing: "#5b5b66",
    label: "#e5e5e5",
    labelOutline: "#0b0b0f",
    edge: "#3a3a44",
  },
  light: {
    skill: "#B7B6CC",
    selectedSkill: "#1C1B2E",
    missing: "#C4C3D6",
    label: "#1C1B2E",
    labelOutline: "#F7F7FB",
    edge: "#CFCEE0",
  },
};
