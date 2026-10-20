import type { TransitionDifficulty } from "../types";

const DOTS: Record<TransitionDifficulty, string> = { Low: "●○○", Medium: "●●○", High: "●●●" };

// Dots rather than green/yellow/red, since hue is reserved for skill categories.
export function Difficulty({ level }: { level: TransitionDifficulty }) {
  return (
    <span className="badge" title={`${level} transition difficulty`}>
      <span aria-hidden="true">{DOTS[level]} </span>
      {level}
    </span>
  );
}
