import type { ReactNode } from "react";

interface FacetSectionProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  summary?: ReactNode;
  children: ReactNode;
}

export function FacetSection({ label, open, onToggle, summary, children }: FacetSectionProps) {
  return (
    <section className="facet">
      <button type="button" className="facet__header" aria-expanded={open} onClick={onToggle}>
        <span className="facet__label">{label}</span>
        <span className="facet__summary">{summary}</span>
        <svg
          className={"facet__chevron" + (open ? " facet__chevron--open" : "")}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>
      {open && <div className="facet__body">{children}</div>}
    </section>
  );
}
