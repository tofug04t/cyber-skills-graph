export type Theme = "dark" | "light";

export type ColorName = "red" | "purple" | "blue" | "green" | "yellow" | "orange" | "white" | "center";

/** Wheel order, then the center. */
export const COLOR_NAMES: ColorName[] = ["red", "purple", "blue", "green", "yellow", "orange", "white", "center"];

// Tuned so every pair stays distinguishable (OKLab distance of about 7 or more) for normal vision and for
// protan/deutan/tritan simulations on both themes; `just palette` re-measures after any edit.
export const PALETTE: Record<Theme, Record<ColorName, string>> = {
  dark: {
    red: "#FF5A5F",
    purple: "#CAA3F5",
    blue: "#518BFA",
    green: "#34D399",
    yellow: "#FFD23F",
    orange: "#FF9F43",
    white: "#E8E8F0",
    center: "#9494A3",
  },
  light: {
    red: "#AF0916",
    purple: "#A56FF1",
    blue: "#1151CC",
    green: "#0F9D6B",
    yellow: "#D4A000",
    orange: "#D16800",
    white: "#FFFFFF",
    center: "#6B6B7A",
  },
};

// Hue carries the category; shape repeats it so color is never the only cue.
export const SHAPES: Record<ColorName, string> = {
  red: "triangle",
  purple: "diamond",
  blue: "ellipse",
  green: "hexagon",
  yellow: "rectangle",
  orange: "pentagon",
  white: "octagon",
  center: "star",
};

export const MEANINGS: Record<ColorName, { name: string; blurb: string }> = {
  red: { name: "Red", blurb: "offense: attacking, testing, breaking" },
  purple: {
    name: "Purple",
    blurb: "turning findings into fixes: threat hunting, purple teaming, adversary emulation for defense",
  },
  blue: { name: "Blue", blurb: "defense: monitoring, threat intel, DFIR" },
  green: { name: "Green", blurb: "securing and automating infrastructure and operations" },
  yellow: { name: "Yellow", blurb: "securing software as it's built, including product security" },
  orange: { name: "Orange", blurb: "teaching security, technical and awareness" },
  white: { name: "White", blurb: "security governance, risk, compliance, and leadership" },
  center: { name: "Middle", blurb: "non-security skills, technical or not" },
};

export interface GraphTheme {
  label: string;
  labelOutline: string;
  nodeBorder: string;
  ring: string;
  /** The map pane's own background; the empty half of a half-filled dot is painted with it. */
  bg: string;
}

export const GRAPH_THEMES: Record<Theme, GraphTheme> = {
  dark: { label: "#e5e5e5", labelOutline: "#0b0b0f", nodeBorder: "#2a2a33", ring: "#ffffff", bg: "#0b0b0f" },
  light: { label: "#1C1B2E", labelOutline: "#F7F7FB", nodeBorder: "#6e6d86", ring: "#1C1B2E", bg: "#f7f7fb" },
};
