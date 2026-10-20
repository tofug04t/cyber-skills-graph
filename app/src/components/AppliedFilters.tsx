export interface AppliedChip {
  key: string;
  kind: string;
  label: string;
  onRemove: () => void;
}

interface AppliedFiltersProps {
  chips: AppliedChip[];
  summary: string | null;
  onClearAll: () => void;
}

// After a removal, keep keyboard focus nearby instead of losing it to <body>.
function refocus(index: number) {
  setTimeout(() => {
    const remaining = document.querySelectorAll<HTMLElement>(".applied__chip");
    const target = remaining[Math.min(index, remaining.length - 1)];
    (target ?? document.querySelector<HTMLElement>(".facet__header"))?.focus();
  }, 0);
}

export function AppliedFilters({ chips, summary, onClearAll }: AppliedFiltersProps) {
  if (chips.length === 0) return null;

  return (
    <div className="applied" role="group" aria-label="Applied filters">
      <div className="applied__chips">
        {chips.map((chip, index) => (
          <button
            key={chip.key}
            type="button"
            className="applied__chip"
            onClick={() => {
              chip.onRemove();
              refocus(index);
            }}
            aria-label={`Remove ${chip.kind}: ${chip.label}`}
            title={`Remove ${chip.kind}: ${chip.label}`}
          >
            <span className="applied__kind">{chip.kind}</span>
            <span className="applied__label">{chip.label}</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        ))}
      </div>
      <div className="applied__footer">
        <span className="applied__summary" role="status">
          {summary}
        </span>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            onClearAll();
            refocus(0);
          }}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
