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
      <summary>Color guide</summary>
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
    </details>
  );
}
