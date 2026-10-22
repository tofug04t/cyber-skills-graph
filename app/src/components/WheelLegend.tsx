import { useState } from "react";
import { COLOR_NAMES, MEANINGS } from "../theme";
import { ColorMark } from "./ColorMark";

const SEEN_KEY = "legendSeen";

// Open on the first visit so newcomers learn the wheel, then stay out of the way.
// On a phone the map is short, so the guide starts closed there.
function firstVisit(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === null && !window.matchMedia("(max-width: 720px)").matches;
  } catch {
    return true;
  }
}

// How a skill's dot changes on the map. Rating is the fill (full, half, hollow), the outline always matches
// the dot's own color, and a picked skill adds a contrasting ring and a larger size. Samples use blue.
type Fill = "full" | "half" | "empty" | "faded";

const STATES: { label: string; detail: string; fill: Fill; picked: boolean }[] = [
  { label: "Strong", detail: "solid dot", fill: "full", picked: false },
  { label: "Some", detail: "half-filled dot", fill: "half", picked: false },
  { label: "None", detail: "hollow dot (also any skill you haven't rated)", fill: "empty", picked: false },
  { label: "Picked", detail: "larger with a dark ring: a skill you chose in the Skill list; its fill still shows your rating", fill: "full", picked: true },
  { label: "Faded", detail: "outside your current selection", fill: "faded", picked: false },
];

function StateSample({ fill, picked }: { fill: Fill; picked: boolean }) {
  const r = picked ? 6 : 4.5;
  const color = "var(--c-blue)";
  return (
    <svg className="legend__sample" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r={r}
        fill={color}
        fillOpacity={fill === "full" ? 1 : fill === "empty" ? 0.15 : fill === "faded" ? 0.15 : 0}
        stroke={picked ? "var(--text)" : color}
        strokeOpacity={fill === "faded" ? 0.15 : 1}
        strokeWidth={picked ? 2.5 : 1.5}
      />
      {fill === "half" && <path d={`M ${8 - r} 8 A ${r} ${r} 0 0 0 ${8 + r} 8 Z`} fill={color} />}
    </svg>
  );
}

export function WheelLegend() {
  const [open, setOpen] = useState(firstVisit);

  return (
    <details
      className="legend"
      open={open}
      onToggle={(e) => {
        const isOpen = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(isOpen);
        try {
          localStorage.setItem(SEEN_KEY, "1");
        } catch {
          // ignore
        }
      }}
    >
      <summary>Map guide</summary>
      <ul>
        {COLOR_NAMES.map((c) => (
          <li key={c}>
            <ColorMark color={c} named={false} />
            <span>
              <strong>{MEANINGS[c].name}</strong> {MEANINGS[c].blurb}
            </span>
          </li>
        ))}
      </ul>
      <h4 className="legend__heading">Your ratings</h4>
      <p className="legend__note">
        Ratings show on skills highlighted by a selected role or skill. The color stays the skill's own.
      </p>
      <ul>
        {STATES.map((s) => (
          <li key={s.label}>
            <StateSample fill={s.fill} picked={s.picked} />
            <span>
              <strong>{s.label}</strong> {s.detail}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
