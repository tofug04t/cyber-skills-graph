import type { MatchMode } from "../types";

interface MatchToggleProps {
  before: string;
  after: string;
  value: MatchMode;
  onChange: (mode: MatchMode) => void;
}

/** "Show roles using [All] [Any] selected skills": how several selections combine. */
export function MatchToggle({ before, after, value, onChange }: MatchToggleProps) {
  return (
    <div className="match-toggle">
      <span>{before}</span>
      <span className="match-toggle__options" role="group" aria-label={`${before} ${after}`}>
        {(["all", "any"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={"match-toggle__option" + (value === mode ? " match-toggle__option--active" : "")}
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
          >
            {mode === "all" ? "All" : "Any"}
          </button>
        ))}
      </span>
      <span>{after}</span>
    </div>
  );
}
