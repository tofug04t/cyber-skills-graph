import type { Assessment, AssessmentValue, Skill } from "../types";
import { skillLabel } from "../filters";

const OPTIONS: { value: AssessmentValue; label: string }[] = [
  { value: "have", label: "Have" },
  { value: "partial", label: "Partial" },
  { value: "missing", label: "Missing" },
];

interface SkillChecklistProps {
  skills: Skill[];
  assessment: Assessment;
  onChange: (skillId: string, value: AssessmentValue) => void;
}

export function SkillChecklist({ skills, assessment, onChange }: SkillChecklistProps) {
  return (
    <ul className="skill-checklist">
      {skills.map((skill) => {
        const current = assessment[skill.id] ?? "missing";
        return (
          <li key={skill.id} className="skill-checklist__row">
            <span className="skill-checklist__text" title={skill.text}>
              {skillLabel(skill)}
            </span>
            <span className="skill-checklist__options">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={
                    "skill-checklist__option" +
                    (current === opt.value ? " skill-checklist__option--active" : "") +
                    ` skill-checklist__option--${opt.value}`
                  }
                  onClick={() => onChange(skill.id, opt.value)}
                  aria-pressed={current === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
