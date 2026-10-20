import type { ColorName } from "../theme";
import { MEANINGS } from "../theme";

// Same shapes as the graph nodes, on a 16x16 grid.
const SHAPE_PATHS: Record<ColorName, string> = {
  red: "M8 2 L14.5 13.5 L1.5 13.5 Z",
  purple: "M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z",
  blue: "M8 2 A6 6 0 1 1 7.99 2 Z",
  green: "M4.5 2 L11.5 2 L15 8 L11.5 14 L4.5 14 L1 8 Z",
  yellow: "M3 3 L13 3 L13 13 L3 13 Z",
  orange: "M8 1.5 L14.5 6.3 L12 14 L4 14 L1.5 6.3 Z",
  white: "M5.2 2 L10.8 2 L14 5.2 L14 10.8 L10.8 14 L5.2 14 L2 10.8 L2 5.2 Z",
  center: "M8 1 L9.8 6 L15 6 L10.8 9.3 L12.4 14.5 L8 11.4 L3.6 14.5 L5.2 9.3 L1 6 L6.2 6 Z",
};

// `named` adds the color name for screen readers; the legend already says it in text.
export function ColorMark({ color, size = 12, named = true }: { color: ColorName; size?: number; named?: boolean }) {
  return (
    <>
      <svg
        className="color-mark"
        width={size}
        height={size}
        viewBox="0 0 16 16"
        aria-hidden="true"
        style={{ fill: `var(--c-${color})` }}
      >
        <path d={SHAPE_PATHS[color]} />
      </svg>
      {named && <span className="sr-only">{MEANINGS[color].name}: </span>}
    </>
  );
}
