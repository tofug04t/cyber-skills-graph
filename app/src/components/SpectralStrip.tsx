import { COLOR_NAMES, type ColorName } from "../theme";

interface SpectralStripProps {
  mix: Partial<Record<ColorName, number>>;
  label: string;
}

/** A role's color makeup as a proportional strip, segments in wheel order. */
export function SpectralStrip({ mix, label }: SpectralStripProps) {
  const parts = COLOR_NAMES.filter((c) => mix[c]);
  const summary = parts.length
    ? parts.map((c) => `${c} ${Math.round((mix[c] ?? 0) * 100)}%`).join(", ")
    : "no color mix";
  return (
    <span className="spectral" role="img" aria-label={`${label}: ${summary}`} title={`${label}: ${summary}`}>
      {parts.map((c) => (
        <span key={c} className="spectral__seg" style={{ flexGrow: mix[c], background: `var(--c-${c})` }} />
      ))}
    </span>
  );
}
