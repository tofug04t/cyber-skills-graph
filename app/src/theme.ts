export type Theme = "dark" | "light";

export type ColorName = "red" | "purple" | "blue" | "green" | "yellow" | "orange" | "white" | "center";

/** Wheel order, then the center. */
export const COLOR_NAMES: ColorName[] = ["red", "purple", "blue", "green", "yellow", "orange", "white", "center"];

// Provisional values: still to be tuned for color-blind distinctness on both themes.
export const PALETTE: Record<Theme, Record<ColorName, string>> = {
  dark: {
    red: "#FF5A5F",
    purple: "#B08CFF",
    blue: "#4DA3FF",
    green: "#34D399",
    yellow: "#FFD23F",
    orange: "#FF9F43",
    white: "#E8E8F0",
    center: "#FF4FD8",
  },
  light: {
    red: "#D92D3A",
    purple: "#7A4FE0",
    blue: "#1F6FE5",
    green: "#0F9D6B",
    yellow: "#D4A000",
    orange: "#E8650A",
    white: "#FFFFFF",
    center: "#D6249F",
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
}

export const GRAPH_THEMES: Record<Theme, GraphTheme> = {
  dark: { label: "#e5e5e5", labelOutline: "#0b0b0f", nodeBorder: "#2a2a33", ring: "#ffffff" },
  light: { label: "#1C1B2E", labelOutline: "#F7F7FB", nodeBorder: "#6e6d86", ring: "#1C1B2E" },
};
