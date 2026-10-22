import type { AssessmentValue } from "../types";
import { MARK_OPTIONS } from "../constants";

interface MarkButtonsProps {
  value: AssessmentValue;
  onChange: (value: AssessmentValue) => void;
}

/** Have / Partial / Missing for one skill; an unmarked skill counts as missing. */
export function MarkButtons({ value, onChange }: MarkButtonsProps) {
  return (
    <span className="skill-checklist__options">
      {MARK_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={
            "skill-checklist__option" +
            (value === opt.value ? " skill-checklist__option--active" : "") +
            ` skill-checklist__option--${opt.value}`
          }
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </span>
  );
}
